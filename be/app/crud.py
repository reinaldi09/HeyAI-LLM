from typing import List, Optional
from uuid import UUID
from sqlalchemy import select, or_, func, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import AssessmentJob, Pasien, PdfDocument, RekamMedis, User
from app.schemas import PasienCreate, PasienUpdate, RekamMedisCreate, RekamMedisUpdate, UserCreate, UserUpdate


async def _next_number(db: AsyncSession, sequence_name: str, prefix: str) -> str:
    result = await db.execute(text(f"SELECT nextval('{sequence_name}')"))
    value = result.scalar_one()
    return f"{prefix}-{value:05d}"


async def create_pasien(db: AsyncSession, data: PasienCreate, apoteker_id: Optional[UUID]) -> Pasien:
    pasien = Pasien(
        **data.model_dump(),
        nomor_pasien=await _next_number(db, "pasien_nomor_seq", "PH"),
        apoteker_id=apoteker_id,
    )
    db.add(pasien)
    await db.commit()
    await db.refresh(pasien)
    return pasien


async def update_pasien(db: AsyncSession, pasien: Pasien, data: PasienUpdate) -> Pasien:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(pasien, key, value)
    await db.commit()
    await db.refresh(pasien)
    return pasien


async def delete_pasien(db: AsyncSession, pasien: Pasien) -> None:
    await db.delete(pasien)
    await db.commit()


def _filter_apoteker(statement, apoteker_id: Optional[UUID]):
    if apoteker_id is None:
        return statement
    return statement.where(Pasien.apoteker_id == apoteker_id)


async def get_pasien_by_id(
    db: AsyncSession,
    pasien_id: UUID,
    apoteker_id: Optional[UUID] = None,
) -> Optional[Pasien]:
    statement = (
        select(Pasien)
        .where(Pasien.id == pasien_id)
        .options(selectinload(Pasien.rekam_medis), selectinload(Pasien.apoteker))
    )
    result = await db.execute(
        _filter_apoteker(statement, apoteker_id)
    )
    return result.scalar_one_or_none()


async def search_pasien(
    db: AsyncSession,
    query: str,
    limit: int = 10,
    apoteker_id: Optional[UUID] = None,
) -> List[Pasien]:
    q = f"%{query}%"
    statement = (
        select(Pasien)
        .options(selectinload(Pasien.apoteker))
        .where(
            or_(
                func.lower(Pasien.nama).like(func.lower(q)),
                func.lower(Pasien.nomor_pasien).like(func.lower(q)),
                func.lower(Pasien.pekerjaan).like(func.lower(q)),
                Pasien.no_hp.like(q),
                func.lower(Pasien.email).like(func.lower(q)),
                func.lower(Pasien.alamat).like(func.lower(q)),
            )
        )
        .order_by(Pasien.nama)
        .limit(limit)
    )
    result = await db.execute(_filter_apoteker(statement, apoteker_id))
    return result.scalars().all()


async def list_pasien(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
    apoteker_id: Optional[UUID] = None,
) -> List[Pasien]:
    result = await db.execute(
        _filter_apoteker(
            select(Pasien)
            .options(selectinload(Pasien.apoteker))
            .order_by(Pasien.nama)
            .offset(skip)
            .limit(limit),
            apoteker_id,
        )
    )
    return result.scalars().all()


async def list_pasien_with_rekam_medis_by_apoteker(
    db: AsyncSession,
    apoteker_id: UUID,
) -> List[Pasien]:
    result = await db.execute(
        select(Pasien)
        .where(Pasien.apoteker_id == apoteker_id)
        .options(selectinload(Pasien.rekam_medis), selectinload(Pasien.apoteker))
        .order_by(Pasien.nama)
    )
    return result.scalars().all()


async def create_rekam_medis(
    db: AsyncSession,
    data: RekamMedisCreate,
    hasil_assessment: Optional[str] = None,
) -> RekamMedis:
    rekam = RekamMedis(
        **data.model_dump(),
        nomor_rekam_medis=await _next_number(db, "rekam_medis_nomor_seq", "RM"),
        hasil_assessment=hasil_assessment,
    )
    db.add(rekam)
    await db.commit()
    await db.refresh(rekam)
    return rekam


async def update_rekam_medis(db: AsyncSession, rekam: RekamMedis, data: RekamMedisUpdate) -> RekamMedis:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(rekam, key, value)
    await db.commit()
    await db.refresh(rekam)
    return rekam


async def delete_rekam_medis(db: AsyncSession, rekam: RekamMedis) -> None:
    await db.delete(rekam)
    await db.commit()


async def create_assessment_job(
    db: AsyncSession,
    *,
    data: RekamMedisCreate,
    apoteker_id: UUID,
    simpan: bool,
) -> AssessmentJob:
    job = AssessmentJob(
        apoteker_id=apoteker_id,
        pasien_id=data.pasien_id,
        subjective=data.subjective,
        objective=data.objective,
        simpan=simpan,
        status="pending",
    )
    db.add(job)
    await db.commit()
    await db.refresh(job, attribute_names=["pasien"])
    return job


async def get_assessment_job_by_id(
    db: AsyncSession,
    job_id: UUID,
    apoteker_id: Optional[UUID] = None,
) -> Optional[AssessmentJob]:
    statement = (
        select(AssessmentJob)
        .where(AssessmentJob.id == job_id)
        .options(selectinload(AssessmentJob.pasien))
    )
    if apoteker_id is not None:
        statement = statement.where(AssessmentJob.apoteker_id == apoteker_id)
    result = await db.execute(statement)
    return result.scalar_one_or_none()


async def list_unfinished_assessment_jobs(db: AsyncSession) -> List[AssessmentJob]:
    result = await db.execute(
        select(AssessmentJob)
        .where(AssessmentJob.status.in_(("pending", "running")))
        .order_by(AssessmentJob.created_at)
    )
    return result.scalars().all()


async def update_assessment_job(db: AsyncSession, job: AssessmentJob, **values) -> AssessmentJob:
    for key, value in values.items():
        setattr(job, key, value)
    await db.commit()
    await db.refresh(job, attribute_names=["pasien"])
    return job


async def get_rekam_medis_by_pasien(
    db: AsyncSession, pasien_id: UUID
) -> List[RekamMedis]:
    result = await db.execute(
        select(RekamMedis)
        .where(RekamMedis.pasien_id == pasien_id)
        .order_by(RekamMedis.created_at.desc())
    )
    return result.scalars().all()


async def get_rekam_medis_by_id(
    db: AsyncSession,
    rekam_id: UUID,
    apoteker_id: Optional[UUID] = None,
) -> Optional[RekamMedis]:
    statement = (
        select(RekamMedis)
        .where(RekamMedis.id == rekam_id)
        .options(selectinload(RekamMedis.pasien))
    )
    if apoteker_id is not None:
        statement = statement.join(Pasien).where(Pasien.apoteker_id == apoteker_id)
    result = await db.execute(
        statement
    )
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    result = await db.execute(select(User).where(func.lower(User.username) == username.lower()))
    return result.scalar_one_or_none()


async def list_users(
    db: AsyncSession,
    role: Optional[str] = None,
    query: Optional[str] = None,
    limit: int = 50,
) -> List[User]:
    statement = select(User).order_by(User.created_at.desc())
    if role:
        statement = statement.where(User.role == role)
    if query:
        keyword = query.strip()
        q = f"%{keyword}%"
        conditions = [
            func.lower(User.nama).like(func.lower(q)),
            func.lower(User.username).like(func.lower(q)),
            func.lower(User.tempat_lahir).like(func.lower(q)),
            User.no_hp.like(q),
            func.lower(User.email).like(func.lower(q)),
            func.lower(User.alamat).like(func.lower(q)),
        ]
        normalized = keyword.lower()
        if normalized in {"aktif", "active"}:
            conditions.append(User.is_active.is_(True))
        if normalized in {"nonaktif", "tidak aktif", "inactive"}:
            conditions.append(User.is_active.is_(False))
        statement = statement.where(or_(*conditions))
    statement = statement.limit(limit)
    result = await db.execute(statement)
    return result.scalars().all()


async def create_user(db: AsyncSession, data: UserCreate, password_hash: str) -> User:
    user = User(
        username=data.username,
        nama=data.nama,
        password_hash=password_hash,
        role=data.role,
        jenis_kelamin=data.jenis_kelamin,
        tempat_lahir=data.tempat_lahir,
        tanggal_lahir=data.tanggal_lahir,
        no_hp=data.no_hp,
        email=data.email,
        alamat=data.alamat,
        is_active=data.is_active,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def update_user(db: AsyncSession, user: User, data: UserUpdate, password_hash: Optional[str] = None) -> User:
    payload = data.model_dump(exclude_unset=True, exclude={"password"})
    for key, value in payload.items():
        setattr(user, key, value)
    if password_hash:
        user.password_hash = password_hash
    await db.commit()
    await db.refresh(user)
    return user


async def delete_user(db: AsyncSession, user: User) -> None:
    await db.delete(user)
    await db.commit()


async def list_pdf_documents(db: AsyncSession) -> List[PdfDocument]:
    result = await db.execute(select(PdfDocument).order_by(PdfDocument.created_at.desc()))
    return result.scalars().all()


async def get_pdf_document_by_id(db: AsyncSession, document_id: UUID) -> Optional[PdfDocument]:
    result = await db.execute(select(PdfDocument).where(PdfDocument.id == document_id))
    return result.scalar_one_or_none()


async def create_pdf_document(
    db: AsyncSession,
    *,
    title: str,
    filename: str,
    original_filename: str,
    file_path: str,
    file_size: int,
    description: str,
    uploaded_by_id: Optional[UUID],
) -> PdfDocument:
    document = PdfDocument(
        title=title,
        filename=filename,
        original_filename=original_filename,
        file_path=file_path,
        file_size=file_size,
        description=description,
        uploaded_by_id=uploaded_by_id,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return document


async def update_pdf_document(db: AsyncSession, document: PdfDocument, **values) -> PdfDocument:
    for key, value in values.items():
        if value is not None:
            setattr(document, key, value)
    await db.commit()
    await db.refresh(document)
    return document


async def delete_pdf_document(db: AsyncSession, document: PdfDocument) -> None:
    await db.delete(document)
    await db.commit()
