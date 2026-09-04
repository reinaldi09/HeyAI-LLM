from datetime import date, datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator


class StrictBaseModel(BaseModel):
    @field_validator("*", mode="before")
    @classmethod
    def reject_blank_strings(cls, value):
        if isinstance(value, str) and not value.strip():
            raise ValueError("wajib diisi")
        return value.strip() if isinstance(value, str) else value


class PasienCreate(StrictBaseModel):
    nama: str = Field(..., min_length=2, max_length=150)
    jenis_kelamin: str = Field(..., pattern="^(laki-laki|perempuan)$")
    tempat_lahir: str = Field(..., min_length=2, max_length=100)
    tanggal_lahir: date
    pekerjaan: str = Field(..., min_length=2, max_length=120)
    no_hp: str = Field(..., min_length=5, max_length=30)
    email: EmailStr
    alamat: str = Field(..., min_length=5, max_length=300)


class PasienUpdate(StrictBaseModel):
    nama: Optional[str] = Field(None, min_length=2, max_length=150)
    jenis_kelamin: Optional[str] = Field(None, pattern="^(laki-laki|perempuan)$")
    tempat_lahir: Optional[str] = Field(None, min_length=2, max_length=100)
    tanggal_lahir: Optional[date] = None
    pekerjaan: Optional[str] = Field(None, min_length=2, max_length=120)
    no_hp: Optional[str] = Field(None, min_length=5, max_length=30)
    email: Optional[EmailStr] = None
    alamat: Optional[str] = Field(None, min_length=5, max_length=300)


class PasienResponse(BaseModel):
    id: UUID
    nama: str
    nomor_pasien: str
    jenis_kelamin: str
    tempat_lahir: str
    tanggal_lahir: date
    pekerjaan: str
    no_hp: str
    email: EmailStr
    alamat: str
    apoteker_id: Optional[UUID]
    apoteker_nama: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PasienSingkat(BaseModel):
    id: UUID
    nama: str
    nomor_pasien: str
    tempat_lahir: str
    tanggal_lahir: date
    jenis_kelamin: str
    pekerjaan: str
    no_hp: str
    email: EmailStr
    alamat: str
    apoteker_id: Optional[UUID]
    apoteker_nama: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RekamMedisCreate(StrictBaseModel):
    pasien_id: UUID
    subjective: str
    objective: str


class RekamMedisUpdate(StrictBaseModel):
    subjective: Optional[str] = None
    objective: Optional[str] = None
    hasil_assessment: Optional[str] = None


class RekamMedisResponse(BaseModel):
    id: UUID
    pasien_id: UUID
    nomor_rekam_medis: str
    subjective: str
    objective: str
    hasil_assessment: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RekamMedisDenganPasien(RekamMedisResponse):
    pasien: PasienSingkat

    model_config = {"from_attributes": True}


class PasienDenganRekamMedis(PasienResponse):
    rekam_medis: List[RekamMedisResponse] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class PharmaRequest(StrictBaseModel):
    pasien_id: UUID
    subjective: str
    objective: str
    simpan: bool = Field(..., description="Simpan hasil ke rekam medis")


class PharmaResponse(BaseModel):
    result: str
    rekam_medis_id: Optional[UUID] = None
    nomor_rekam_medis: Optional[str] = None


class AssessmentJobResponse(BaseModel):
    id: UUID
    apoteker_id: UUID
    pasien_id: UUID
    pasien: PasienSingkat
    rekam_medis_id: Optional[UUID]
    nomor_rekam_medis: Optional[str]
    subjective: str
    objective: str
    simpan: bool
    status: str
    result: Optional[str]
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserCreate(StrictBaseModel):
    username: str = Field(..., min_length=3, max_length=80)
    nama: str = Field(..., min_length=2, max_length=150)
    password: str = Field(..., min_length=8)
    role: str = Field("apoteker", pattern="^(apoteker|superadmin)$")
    jenis_kelamin: str = Field(..., pattern="^(laki-laki|perempuan)$")
    tempat_lahir: str = Field(..., min_length=2, max_length=100)
    tanggal_lahir: date
    no_hp: str = Field(..., min_length=5, max_length=30)
    email: EmailStr
    alamat: str = Field(..., min_length=5, max_length=300)
    is_active: bool = True


class UserUpdate(StrictBaseModel):
    nama: Optional[str] = Field(None, min_length=2, max_length=150)
    password: Optional[str] = Field(None, min_length=8)
    role: Optional[str] = Field(None, pattern="^(apoteker|superadmin)$")
    jenis_kelamin: Optional[str] = Field(None, pattern="^(laki-laki|perempuan)$")
    tempat_lahir: Optional[str] = Field(None, max_length=100)
    tanggal_lahir: Optional[date] = None
    no_hp: Optional[str] = Field(None, min_length=5, max_length=30)
    email: Optional[EmailStr] = None
    alamat: Optional[str] = Field(None, min_length=5, max_length=300)
    is_active: Optional[bool] = None


class UserSelfUpdate(StrictBaseModel):
    nama: Optional[str] = Field(None, min_length=2, max_length=150)
    password: Optional[str] = Field(None, min_length=8)
    jenis_kelamin: Optional[str] = Field(None, pattern="^(laki-laki|perempuan)$")
    tempat_lahir: Optional[str] = Field(None, min_length=2, max_length=100)
    tanggal_lahir: Optional[date] = None
    no_hp: Optional[str] = Field(None, min_length=5, max_length=30)
    email: Optional[EmailStr] = None
    alamat: Optional[str] = Field(None, min_length=5, max_length=300)


class UserResponse(BaseModel):
    id: UUID
    username: str
    nama: str
    role: str
    jenis_kelamin: Optional[str]
    tempat_lahir: Optional[str]
    tanggal_lahir: Optional[date]
    no_hp: Optional[str]
    email: Optional[EmailStr]
    alamat: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class LoginRequest(StrictBaseModel):
    username: str
    password: str
    captcha_id: str
    captcha_answer: str


class LoginResponse(BaseModel):
    user: UserResponse


class CaptchaResponse(BaseModel):
    captcha_id: str
    image_data_uri: str
    expires_in_seconds: int


class PdfDocumentResponse(BaseModel):
    id: UUID
    title: str
    filename: str
    original_filename: str
    file_size: int
    description: str
    uploaded_by_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
