from datetime import date, datetime
from typing import List, Optional
import uuid

from sqlalchemy import (String, Date, DateTime, Text, ForeignKey, Enum as SAEnum, Boolean, Integer, func, inspect)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
import enum


class JenisKelamin(str, enum.Enum):
    laki_laki = "laki-laki"
    perempuan = "perempuan"


class UserRole(str, enum.Enum):
    superadmin = "superadmin"
    apoteker = "apoteker"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(80), unique=True, nullable=False, index=True)
    nama: Mapped[str] = mapped_column(String(150), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default=UserRole.apoteker.value)
    jenis_kelamin: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    tempat_lahir: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tanggal_lahir: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    no_hp: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    alamat: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    pasien: Mapped[List["Pasien"]] = relationship("Pasien", back_populates="apoteker")


class Pasien(Base):
    __tablename__ = "pasien"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    jenis_kelamin: Mapped[JenisKelamin] = mapped_column(
        SAEnum(JenisKelamin, name="jeniskelamin"), nullable=False
    )
    tempat_lahir: Mapped[str] = mapped_column(String(100), nullable=False)
    tanggal_lahir: Mapped[date] = mapped_column(Date, nullable=False)
    pekerjaan: Mapped[str] = mapped_column(String(120), nullable=False)
    nomor_pasien: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    no_hp: Mapped[str] = mapped_column(String(30), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False)
    alamat: Mapped[str] = mapped_column(Text, nullable=False)
    apoteker_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    apoteker: Mapped[Optional["User"]] = relationship("User", back_populates="pasien")
    rekam_medis: Mapped[List["RekamMedis"]] = relationship(
        "RekamMedis",
        back_populates="pasien",
        cascade="all, delete-orphan",
        order_by="RekamMedis.created_at.desc()",
    )

    def __repr__(self) -> str:
        return f"<Pasien id={self.id} nama={self.nama!r}>"

    @property
    def apoteker_nama(self) -> Optional[str]:
        if "apoteker" in inspect(self).unloaded:
            return None
        return self.apoteker.nama if self.apoteker else None


class RekamMedis(Base):
    __tablename__ = "rekam_medis"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pasien_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pasien.id", ondelete="CASCADE"), nullable=False, index=True
    )
    nomor_rekam_medis: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    subjective: Mapped[str] = mapped_column(Text, nullable=False)
    objective: Mapped[str] = mapped_column(Text, nullable=False)
    hasil_assessment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    pasien: Mapped["Pasien"] = relationship("Pasien", back_populates="rekam_medis")

    def __repr__(self) -> str:
        return f"<RekamMedis id={self.id} pasien_id={self.pasien_id}>"


class AssessmentJob(Base):
    __tablename__ = "assessment_jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    apoteker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pasien_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("pasien.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rekam_medis_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("rekam_medis.id", ondelete="SET NULL"), nullable=True
    )
    nomor_rekam_medis: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    subjective: Mapped[str] = mapped_column(Text, nullable=False)
    objective: Mapped[str] = mapped_column(Text, nullable=False)
    simpan: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    result: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    apoteker: Mapped["User"] = relationship("User")
    pasien: Mapped["Pasien"] = relationship("Pasien")
    rekam_medis: Mapped[Optional["RekamMedis"]] = relationship("RekamMedis")


class PdfDocument(Base):
    __tablename__ = "pdf_documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    uploaded_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
