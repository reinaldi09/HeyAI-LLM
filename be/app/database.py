import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(DATABASE_URL, echo=False, pool_size=10, max_overflow=20)

AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    from app import models
    from app.auth import hash_password
    from app.models import PdfDocument, User
    from sqlalchemy import select
    from pathlib import Path

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for table_name in ("users", "pasien", "rekam_medis", "pdf_documents"):
            result = await conn.exec_driver_sql(
                f"""
                SELECT udt_name
                FROM information_schema.columns
                WHERE table_schema = 'public'
                  AND table_name = '{table_name}'
                  AND column_name = 'id'
                """
            )
            row = result.first()
            if row and row[0] != "uuid":
                raise RuntimeError(
                    f"Tabel {table_name}.id masih bertipe {row[0]}. "
                    "Reset/migrasikan database sebelum memakai skema UUID."
                )

        # Sequences
        await conn.exec_driver_sql("""
            CREATE SEQUENCE IF NOT EXISTS pasien_nomor_seq START 1
        """)

        await conn.exec_driver_sql("""
            CREATE SEQUENCE IF NOT EXISTS rekam_medis_nomor_seq START 1
        """)


        # Users table
        await conn.exec_driver_sql("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20)
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100)
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS tanggal_lahir DATE
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS no_hp VARCHAR(30)
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS email VARCHAR(150)
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS alamat TEXT
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()
        """)


        # Pasien table - add columns
        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            ADD COLUMN IF NOT EXISTS pekerjaan VARCHAR(120)
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            ADD COLUMN IF NOT EXISTS nomor_pasien VARCHAR(20)
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            ADD COLUMN IF NOT EXISTS no_hp VARCHAR(30)
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            ADD COLUMN IF NOT EXISTS email VARCHAR(150)
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            ADD COLUMN IF NOT EXISTS alamat TEXT
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            ADD COLUMN IF NOT EXISTS apoteker_id UUID REFERENCES users(id) ON DELETE SET NULL
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            DROP COLUMN IF EXISTS no_rekam_medis
        """)


        # Pasien table - backfill existing data
        await conn.exec_driver_sql("""
            UPDATE pasien
            SET pekerjaan = 'Belum diisi'
            WHERE pekerjaan IS NULL
        """)

        await conn.exec_driver_sql("""
            UPDATE pasien
            SET no_hp = 'Belum diisi'
            WHERE no_hp IS NULL
        """)

        await conn.exec_driver_sql("""
            UPDATE pasien
            SET email = 'belum-diisi-' || id::text || '@local.invalid'
            WHERE email IS NULL
        """)

        await conn.exec_driver_sql("""
            UPDATE pasien
            SET alamat = 'Belum diisi'
            WHERE alamat IS NULL
        """)

        await conn.exec_driver_sql("""
            UPDATE pasien
            SET nomor_pasien = 'PH-' || LPAD(nextval('pasien_nomor_seq')::text, 5, '0')
            WHERE nomor_pasien IS NULL
        """)


        # Pasien table - constraints & indexes
        await conn.exec_driver_sql("""
            CREATE UNIQUE INDEX IF NOT EXISTS ux_pasien_nomor_pasien
            ON pasien (nomor_pasien)
        """)

        await conn.exec_driver_sql("""
            CREATE INDEX IF NOT EXISTS ix_pasien_apoteker_id
            ON pasien (apoteker_id)
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            ALTER COLUMN pekerjaan SET NOT NULL
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            ALTER COLUMN nomor_pasien SET NOT NULL
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            ALTER COLUMN no_hp SET NOT NULL
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            ALTER COLUMN email SET NOT NULL
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pasien
            ALTER COLUMN alamat SET NOT NULL
        """)


        # Rekam medis table
        await conn.exec_driver_sql("""
            ALTER TABLE rekam_medis
            ADD COLUMN IF NOT EXISTS nomor_rekam_medis VARCHAR(20)
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE rekam_medis
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()
        """)

        await conn.exec_driver_sql("""
            UPDATE rekam_medis
            SET nomor_rekam_medis = 'RM-' || LPAD(nextval('rekam_medis_nomor_seq')::text, 5, '0')
            WHERE nomor_rekam_medis IS NULL
        """)

        await conn.exec_driver_sql("""
            CREATE UNIQUE INDEX IF NOT EXISTS ux_rekam_medis_nomor_rekam_medis
            ON rekam_medis (nomor_rekam_medis)
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE rekam_medis
            ALTER COLUMN nomor_rekam_medis SET NOT NULL
        """)


        # PDF documents table
        await conn.exec_driver_sql("""
            ALTER TABLE pdf_documents
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()
        """)

        await conn.exec_driver_sql("""
            UPDATE pdf_documents
            SET description = 'Dokumen RAG'
            WHERE description IS NULL
        """)

        await conn.exec_driver_sql("""
            ALTER TABLE pdf_documents
            ALTER COLUMN description SET NOT NULL
        """)
        await conn.exec_driver_sql(
            """
            DO $$
            DECLARE current_max integer;
            BEGIN
                SELECT COALESCE(MAX(NULLIF(regexp_replace(nomor_pasien, '\\D', '', 'g'), '')::integer), 0)
                INTO current_max
                FROM pasien;
                IF current_max > 0 THEN
                    PERFORM setval('pasien_nomor_seq', current_max, true);
                END IF;
            END $$;
            """
        )
        await conn.exec_driver_sql(
            """
            DO $$
            DECLARE current_max integer;
            BEGIN
                SELECT COALESCE(MAX(NULLIF(regexp_replace(nomor_rekam_medis, '\\D', '', 'g'), '')::integer), 0)
                INTO current_max
                FROM rekam_medis;
                IF current_max > 0 THEN
                    PERFORM setval('rekam_medis_nomor_seq', current_max, true);
                END IF;
            END $$;
            """
        )

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.role == "superadmin"))
        if not result.scalar_one_or_none():
            superadmin_password = os.getenv("SUPERADMIN_PASSWORD")
            if not superadmin_password:
                raise RuntimeError("SUPERADMIN_PASSWORD wajib diisi saat membuat superadmin awal.")
            if superadmin_password.startswith("replace-with"):
                raise RuntimeError("SUPERADMIN_PASSWORD masih menggunakan placeholder.")

            session.add(User(
                username=os.getenv("SUPERADMIN_USERNAME", "superadmin"),
                nama=os.getenv("SUPERADMIN_NAME", "Super Admin"),
                password_hash=hash_password(superadmin_password),
                role="superadmin",
                is_active=True,
            ))
            await session.commit()

        data_dir = Path("data")
        if data_dir.exists():
            for pdf in data_dir.glob("*.pdf"):
                existing = await session.execute(select(PdfDocument).where(PdfDocument.filename == pdf.name))
                if existing.scalar_one_or_none():
                    continue
                session.add(PdfDocument(
                    title=pdf.stem,
                    filename=pdf.name,
                    original_filename=pdf.name,
                    file_path=str(pdf),
                    file_size=pdf.stat().st_size,
                    description="Dokumen awal",
                    uploaded_by_id=None,
                ))
            await session.commit()
        
