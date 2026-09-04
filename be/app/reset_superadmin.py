import asyncio
import os

from sqlalchemy import select

from app.auth import hash_password
from app.database import AsyncSessionLocal
from app.models import User


async def main() -> None:
    username = os.getenv("SUPERADMIN_USERNAME", "superadmin")
    password = os.getenv("SUPERADMIN_PASSWORD")

    if not password:
        print("❌ SUPERADMIN_PASSWORD tidak di-set di environment.")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.role == "superadmin"))
        user = result.scalar_one_or_none()

        if not user:
            print("❌ User superadmin tidak ditemukan di database.")
            return

        user.password_hash = hash_password(password)
        user.is_active = True
        await db.commit()

        print(f"✅ Password superadmin '{user.username}' berhasil di-reset.")


if __name__ == "__main__":
    asyncio.run(main())
