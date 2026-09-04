import asyncio
from contextlib import asynccontextmanager
from typing import List, Optional
from uuid import UUID

from fastapi import BackgroundTasks, FastAPI, Depends, File, Form, HTTPException, Query, Request, Response, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.rag_engine import generate_pharma_assessment

from app.database import AsyncSessionLocal, get_db, init_db
from app import crud
from app.auth import (
    clear_auth_cookie,
    assert_login_not_locked,
    clear_login_failures,
    create_access_token,
    create_captcha_challenge,
    hash_password,
    record_login_failure,
    require_role,
    set_auth_cookie,
    verify_captcha_challenge,
    verify_password,
)
from app.document_service import delete_file, rebuild_vector_index, save_pdf_upload
from app.models import User
from app.schemas import (
    AssessmentJobResponse,
    CaptchaResponse,
    LoginRequest, LoginResponse,
    PasienCreate, PasienDenganRekamMedis, PasienResponse, PasienSingkat, PasienUpdate,
    PdfDocumentResponse,
    RekamMedisCreate, RekamMedisResponse, RekamMedisDenganPasien, RekamMedisUpdate,
    PharmaRequest, PharmaResponse,
    UserCreate, UserResponse, UserSelfUpdate, UserUpdate,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # buat tabel jika belum ada
    await init_db()
    async with AsyncSessionLocal() as db:
        unfinished_jobs = await crud.list_unfinished_assessment_jobs(db)
        for job in unfinished_jobs:
            asyncio.create_task(process_assessment_job(job.id))
    yield

app = FastAPI(
    title="PharmaCare by heyAI",
    version="2.0.0",
    lifespan=lifespan
)

ApotekerOrSuperAdminUser = Depends(require_role("apoteker", "superadmin"))
ApotekerUser = Depends(require_role("apoteker"))
SuperAdminUser = Depends(require_role("superadmin"))


def owned_apoteker_id(user: User) -> Optional[UUID]:
    return user.id if user.role == "apoteker" else None


async def process_assessment_job(job_id: UUID) -> None:
    async with AsyncSessionLocal() as db:
        job = await crud.get_assessment_job_by_id(db, job_id)
        if not job or job.status not in {"pending", "running"}:
            return

        await crud.update_assessment_job(db, job, status="running", error_message=None)

        try:
            hasil = await run_in_threadpool(
                generate_pharma_assessment,
                subjective=job.subjective,
                objective=job.objective,
            )

            rekam_medis_id = None
            nomor_rekam_medis = None
            if job.simpan:
                rekam = await crud.create_rekam_medis(
                    db,
                    data=RekamMedisCreate(
                        pasien_id=job.pasien_id,
                        subjective=job.subjective,
                        objective=job.objective,
                    ),
                    hasil_assessment=hasil,
                )
                rekam_medis_id = rekam.id
                nomor_rekam_medis = rekam.nomor_rekam_medis

            await crud.update_assessment_job(
                db,
                job,
                status="completed",
                result=hasil,
                error_message=None,
                rekam_medis_id=rekam_medis_id,
                nomor_rekam_medis=nomor_rekam_medis,
            )
        except Exception as exc:
            await crud.update_assessment_job(
                db,
                job,
                status="failed",
                error_message=f"RAG error: {exc}",
            )


# auth
@app.get("/auth/captcha", response_model=CaptchaResponse, tags=["Auth"])
async def captcha(response: Response):
    captcha_id, image_data_uri, expires_in_seconds = create_captcha_challenge()
    response.headers["Cache-Control"] = "no-store"
    return CaptchaResponse(
        captcha_id=captcha_id,
        image_data_uri=image_data_uri,
        expires_in_seconds=expires_in_seconds,
    )


@app.post("/auth/login", response_model=LoginResponse, tags=["Auth"])
async def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    client_ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "unknown")
    client_ip = client_ip.split(",", 1)[0].strip()
    login_key = f"{data.username.lower()}:{client_ip}"

    assert_login_not_locked(login_key)

    if not verify_captcha_challenge(data.captcha_id, data.captcha_answer):
        record_login_failure(login_key)
        raise HTTPException(status_code=400, detail="Captcha tidak valid atau sudah kedaluwarsa")

    user = await crud.get_user_by_username(db, data.username)
    if not user or not user.is_active or not verify_password(data.password, user.password_hash):
        record_login_failure(login_key)
        raise HTTPException(status_code=401, detail="Username atau password salah")

    clear_login_failures(login_key)
    set_auth_cookie(response, create_access_token(user))
    return LoginResponse(user=user)


@app.post("/auth/logout", tags=["Auth"])
async def logout(response: Response):
    clear_auth_cookie(response)
    return {"detail": "Logout berhasil"}


@app.get("/auth/me", response_model=UserResponse, tags=["Auth"])
async def me(current_user: User = Depends(require_role("apoteker", "superadmin"))):
    return current_user


@app.put("/auth/me", response_model=UserResponse, tags=["Auth"])
async def update_me(
    data: UserSelfUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("apoteker", "superadmin")),
):
    password_hash = hash_password(data.password) if data.password else None
    return await crud.update_user(db, current_user, data, password_hash=password_hash)


# apoteker users
@app.get("/users", response_model=List[UserResponse], tags=["Users"])
async def daftar_user(
    role: Optional[str] = Query(None, pattern="^(apoteker|superadmin)$"),
    q: Optional[str] = Query(None, min_length=1, description="Nama, username, no handphone, email, atau status"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = SuperAdminUser,
):
    return await crud.list_users(db, role=role, query=q, limit=limit)


@app.post("/users", response_model=UserResponse, tags=["Users"])
async def buat_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = SuperAdminUser,
):
    existing = await crud.get_user_by_username(db, data.username)
    if existing:
        raise HTTPException(status_code=409, detail="Username sudah digunakan")
    return await crud.create_user(db, data, hash_password(data.password))


@app.get("/users/{user_id}/pasien", response_model=List[PasienDenganRekamMedis], tags=["Users"])
async def daftar_pasien_apoteker(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = SuperAdminUser,
):
    user = await crud.get_user_by_id(db, user_id)
    if not user or user.role != "apoteker":
        raise HTTPException(status_code=404, detail="Apoteker tidak ditemukan")
    return await crud.list_pasien_with_rekam_medis_by_apoteker(db, user_id)


@app.put("/users/{user_id}", response_model=UserResponse, tags=["Users"])
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = SuperAdminUser,
):
    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    password_hash = hash_password(data.password) if data.password else None
    return await crud.update_user(db, user, data, password_hash=password_hash)


@app.delete("/users/{user_id}", tags=["Users"])
async def hapus_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = SuperAdminUser,
):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Tidak bisa menghapus akun sendiri")
    user = await crud.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    await crud.delete_user(db, user)
    return {"detail": "User dihapus"}

# pasien
@app.post("/pasien", response_model=PasienResponse, tags=["Pasien"])
async def buat_pasien(
    data: PasienCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = ApotekerUser,
):
    return await crud.create_pasien(db, data, apoteker_id=current_user.id)


@app.get("/pasien", response_model=List[PasienSingkat], tags=["Pasien"])
async def daftar_pasien(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = ApotekerOrSuperAdminUser,
):
    return await crud.list_pasien(db, skip=skip, limit=limit, apoteker_id=owned_apoteker_id(current_user))


@app.get("/pasien/search", response_model=List[PasienSingkat], tags=["Pasien"])
async def cari_pasien(
    q: str = Query(..., min_length=1, description="Nomor pasien, nama, pekerjaan, no handphone, atau email"),
    db: AsyncSession = Depends(get_db),
    current_user: User = ApotekerOrSuperAdminUser,
):
    return await crud.search_pasien(db, query=q, apoteker_id=owned_apoteker_id(current_user))


@app.get("/pasien/{pasien_id}", response_model=PasienResponse, tags=["Pasien"])
async def detail_pasien(
    pasien_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = ApotekerOrSuperAdminUser,
):
    pasien = await crud.get_pasien_by_id(db, pasien_id, apoteker_id=owned_apoteker_id(current_user))
    if not pasien:
        raise HTTPException(status_code=404, detail="Pasien tidak ditemukan")
    return pasien


@app.put("/pasien/{pasien_id}", response_model=PasienResponse, tags=["Pasien"])
async def update_pasien(
    pasien_id: UUID,
    data: PasienUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = ApotekerUser,
):
    pasien = await crud.get_pasien_by_id(db, pasien_id, apoteker_id=current_user.id)
    if not pasien:
        raise HTTPException(status_code=404, detail="Pasien tidak ditemukan")
    return await crud.update_pasien(db, pasien, data)


@app.delete("/pasien/{pasien_id}", tags=["Pasien"])
async def hapus_pasien(
    pasien_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = SuperAdminUser,
):
    pasien = await crud.get_pasien_by_id(db, pasien_id)
    if not pasien:
        raise HTTPException(status_code=404, detail="Pasien tidak ditemukan")
    await crud.delete_pasien(db, pasien)
    return {"detail": "Pasien dihapus"}


# rekam medis
@app.get(
    "/pasien/{pasien_id}/rekam-medis",
    response_model=List[RekamMedisResponse],
    tags=["Rekam Medis"],
)
async def riwayat_rekam_medis(
    pasien_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = ApotekerOrSuperAdminUser,
):
    pasien = await crud.get_pasien_by_id(db, pasien_id, apoteker_id=owned_apoteker_id(current_user))
    if not pasien:
        raise HTTPException(status_code=404, detail="Pasien tidak ditemukan")
    return await crud.get_rekam_medis_by_pasien(db, pasien_id)


@app.get(
    "/rekam-medis/{rekam_id}",
    response_model=RekamMedisDenganPasien,
    tags=["Rekam Medis"],
)
async def detail_rekam_medis(
    rekam_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = ApotekerOrSuperAdminUser,
):
    rekam = await crud.get_rekam_medis_by_id(db, rekam_id, apoteker_id=owned_apoteker_id(current_user))
    if not rekam:
        raise HTTPException(status_code=404, detail="Rekam medis tidak ditemukan")
    return rekam


@app.post("/rekam-medis", response_model=RekamMedisResponse, tags=["Rekam Medis"])
async def buat_rekam_medis(
    data: RekamMedisCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = ApotekerUser,
):
    pasien = await crud.get_pasien_by_id(db, data.pasien_id, apoteker_id=current_user.id)
    if not pasien:
        raise HTTPException(status_code=404, detail="Pasien tidak ditemukan")
    return await crud.create_rekam_medis(db, data)


@app.put("/rekam-medis/{rekam_id}", response_model=RekamMedisResponse, tags=["Rekam Medis"])
async def update_rekam_medis(
    rekam_id: UUID,
    data: RekamMedisUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = ApotekerUser,
):
    rekam = await crud.get_rekam_medis_by_id(db, rekam_id, apoteker_id=current_user.id)
    if not rekam:
        raise HTTPException(status_code=404, detail="Rekam medis tidak ditemukan")
    return await crud.update_rekam_medis(db, rekam, data)


@app.delete("/rekam-medis/{rekam_id}", tags=["Rekam Medis"])
async def hapus_rekam_medis(
    rekam_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = SuperAdminUser,
):
    rekam = await crud.get_rekam_medis_by_id(db, rekam_id)
    if not rekam:
        raise HTTPException(status_code=404, detail="Rekam medis tidak ditemukan")
    await crud.delete_rekam_medis(db, rekam)
    return {"detail": "Rekam medis dihapus"}


# RAG
@app.post("/assessment-jobs", response_model=AssessmentJobResponse, status_code=202, tags=["Assessment"])
async def buat_assessment_job(
    request: PharmaRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = ApotekerUser,
):
    pasien = await crud.get_pasien_by_id(db, request.pasien_id, apoteker_id=current_user.id)
    if not pasien:
        raise HTTPException(status_code=404, detail="Pasien tidak ditemukan")

    job = await crud.create_assessment_job(
        db,
        data=RekamMedisCreate(
            pasien_id=request.pasien_id,
            subjective=request.subjective,
            objective=request.objective,
        ),
        apoteker_id=current_user.id,
        simpan=request.simpan,
    )
    background_tasks.add_task(process_assessment_job, job.id)
    return job


@app.get("/assessment-jobs/{job_id}", response_model=AssessmentJobResponse, tags=["Assessment"])
async def detail_assessment_job(
    job_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = ApotekerUser,
):
    job = await crud.get_assessment_job_by_id(db, job_id, apoteker_id=current_user.id)
    if not job:
        raise HTTPException(status_code=404, detail="Job asesmen tidak ditemukan")
    return job


@app.post("/pharma-assessment", response_model=PharmaResponse, tags=["Assessment"])
async def pharma_assessment(
    request: PharmaRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = ApotekerUser,
):
    pasien = await crud.get_pasien_by_id(db, request.pasien_id, apoteker_id=current_user.id)
    if not pasien:
        raise HTTPException(status_code=404, detail="Pasien tidak ditemukan")

    try:
        hasil = await run_in_threadpool(
            generate_pharma_assessment,
            subjective=request.subjective,
            objective=request.objective,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG error: {str(e)}")

    rekam_medis_id = None
    nomor_rekam_medis = None
    if request.simpan:
        rekam = await crud.create_rekam_medis(
            db,
            data=RekamMedisCreate(
                pasien_id=request.pasien_id,
                subjective=request.subjective,
                objective=request.objective,
            ),
            hasil_assessment=hasil,
        )
        rekam_medis_id = rekam.id
        nomor_rekam_medis = rekam.nomor_rekam_medis

    return PharmaResponse(
        result=hasil,
        rekam_medis_id=rekam_medis_id,
        nomor_rekam_medis=nomor_rekam_medis,
    )


# dokumen PDF RAG
@app.get("/documents", response_model=List[PdfDocumentResponse], tags=["Documents"])
async def daftar_dokumen(
    db: AsyncSession = Depends(get_db),
    current_user: User = SuperAdminUser,
):
    return await crud.list_pdf_documents(db)


@app.post("/documents", response_model=PdfDocumentResponse, tags=["Documents"])
async def upload_dokumen(
    title: str = Form(..., min_length=1),
    description: str = Form(..., min_length=1),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = SuperAdminUser,
):
    title = title.strip()
    description = description.strip()
    if not title or not description:
        raise HTTPException(status_code=422, detail="Judul dan deskripsi wajib diisi")

    filename, path, size = await save_pdf_upload(file)
    document = await crud.create_pdf_document(
        db,
        title=title,
        filename=filename,
        original_filename=file.filename or filename,
        file_path=str(path),
        file_size=size,
        description=description,
        uploaded_by_id=current_user.id,
    )
    try:
        await run_in_threadpool(rebuild_vector_index)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Dokumen tersimpan, tetapi indexing gagal: {exc}")
    return document


@app.put("/documents/{document_id}", response_model=PdfDocumentResponse, tags=["Documents"])
async def update_dokumen(
    document_id: UUID,
    title: Optional[str] = Form(None, min_length=1),
    description: Optional[str] = Form(None, min_length=1),
    file: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = SuperAdminUser,
):
    document = await crud.get_pdf_document_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")

    if title is not None:
        title = title.strip()
        if not title:
            raise HTTPException(status_code=422, detail="Judul wajib diisi")
    if description is not None:
        description = description.strip()
        if not description:
            raise HTTPException(status_code=422, detail="Deskripsi wajib diisi")

    values = {"title": title, "description": description}
    if file and file.filename:
        old_path = document.file_path
        filename, path, size = await save_pdf_upload(file)
        values.update(
            filename=filename,
            original_filename=file.filename,
            file_path=str(path),
            file_size=size,
        )
        delete_file(old_path)

    document = await crud.update_pdf_document(db, document, **values)
    try:
        await run_in_threadpool(rebuild_vector_index)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Dokumen diperbarui, tetapi indexing gagal: {exc}")
    return document


@app.delete("/documents/{document_id}", tags=["Documents"])
async def hapus_dokumen(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = SuperAdminUser,
):
    document = await crud.get_pdf_document_by_id(db, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Dokumen tidak ditemukan")
    delete_file(document.file_path)
    await crud.delete_pdf_document(db, document)
    try:
        await run_in_threadpool(rebuild_vector_index)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Dokumen dihapus, tetapi indexing gagal: {exc}")
    return {"detail": "Dokumen dihapus"}
