import base64
import hashlib
import hmac
import os
import secrets
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Cookie, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.database import get_db
from app.models import User


SECRET_KEY = os.getenv("SECRET_KEY")
TOKEN_TTL_HOURS = int(os.getenv("TOKEN_TTL_HOURS", "12"))
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS512")
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", "pharma-rag")
JWT_ISSUER = os.getenv("JWT_ISSUER", "pharma-rag-api")
JWT_LEEWAY_SECONDS = int(os.getenv("JWT_LEEWAY_SECONDS", "30"))
AUTH_COOKIE_NAME = os.getenv("AUTH_COOKIE_NAME", "pharma_access_token")
AUTH_COOKIE_SECURE = os.getenv("AUTH_COOKIE_SECURE", "false").lower() == "true"
AUTH_COOKIE_SAMESITE = os.getenv("AUTH_COOKIE_SAMESITE", "lax")
CAPTCHA_TTL_SECONDS = int(os.getenv("CAPTCHA_TTL_SECONDS", "300"))
CAPTCHA_CODE_LENGTH = int(os.getenv("CAPTCHA_CODE_LENGTH", "6"))
CAPTCHA_MAX_ATTEMPTS = int(os.getenv("CAPTCHA_MAX_ATTEMPTS", "3"))
LOGIN_MAX_FAILED_ATTEMPTS = int(os.getenv("LOGIN_MAX_FAILED_ATTEMPTS", "5"))
LOGIN_LOCKOUT_SECONDS = int(os.getenv("LOGIN_LOCKOUT_SECONDS", "900"))
PASSWORD_ITERATIONS = 120000
ALLOWED_JWT_ALGORITHMS = {"HS512"}
CAPTCHA_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
_login_attempts: dict[str, tuple[int, float]] = {}


@dataclass
class CaptchaChallenge:
    answer_hash: str
    salt: str
    expires_at: float
    attempts: int = 0


_captcha_store: dict[str, CaptchaChallenge] = {}

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY wajib diisi untuk menjalankan backend.")

if SECRET_KEY.startswith("replace-with"):
    raise RuntimeError("SECRET_KEY masih menggunakan placeholder. Isi dengan secret acak.")

if len(SECRET_KEY) < 64:
    raise RuntimeError("SECRET_KEY minimal 64 karakter untuk keamanan JWT HS512.")

if JWT_ALGORITHM not in ALLOWED_JWT_ALGORITHMS:
    raise RuntimeError("JWT_ALGORITHM hanya boleh menggunakan HS512.")


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    )
    return f"pbkdf2_sha256${salt}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, salt, digest = password_hash.split("$", 2)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    new_digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        PASSWORD_ITERATIONS,
    ).hex()
    return hmac.compare_digest(new_digest, digest)


def _cleanup_captcha_store() -> None:
    now = time.time()
    expired_ids = [
        challenge_id
        for challenge_id, challenge in _captcha_store.items()
        if challenge.expires_at <= now
    ]
    for challenge_id in expired_ids:
        _captcha_store.pop(challenge_id, None)


def _captcha_digest(challenge_id: str, salt: str, answer: str) -> str:
    normalized_answer = answer.strip().upper()
    message = f"{challenge_id}:{salt}:{normalized_answer}".encode("utf-8")
    return hmac.new(SECRET_KEY.encode("utf-8"), message, hashlib.sha256).hexdigest()


def _captcha_code() -> str:
    return "".join(secrets.choice(CAPTCHA_ALPHABET) for _ in range(CAPTCHA_CODE_LENGTH))


def _captcha_svg_data_uri(code: str) -> str:
    width = 220
    height = 72
    noise_lines = []
    noise_dots = []
    characters = []

    for _ in range(9):
        x1, y1 = secrets.randbelow(width), secrets.randbelow(height)
        x2, y2 = secrets.randbelow(width), secrets.randbelow(height)
        color = secrets.choice(["#8aba97", "#aaa694", "#ccc9bc", "#5e9d6f"])
        opacity = 0.25 + secrets.randbelow(35) / 100
        noise_lines.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'stroke="{color}" stroke-width="2" opacity="{opacity:.2f}" />'
        )

    for _ in range(38):
        cx, cy = secrets.randbelow(width), secrets.randbelow(height)
        radius = secrets.randbelow(3) + 1
        color = secrets.choice(["#141310", "#57533f", "#8aba97", "#ccc9bc"])
        opacity = 0.16 + secrets.randbelow(34) / 100
        noise_dots.append(
            f'<circle cx="{cx}" cy="{cy}" r="{radius}" fill="{color}" opacity="{opacity:.2f}" />'
        )

    start_x = 25
    spacing = 30
    for index, character in enumerate(code):
        x = start_x + index * spacing + secrets.randbelow(7)
        y = 45 + secrets.randbelow(10) - 5
        rotate = secrets.randbelow(31) - 15
        characters.append(
            f'<text x="{x}" y="{y}" transform="rotate({rotate} {x} {y})" '
            'font-family="monospace" font-size="34" font-weight="700" '
            f'fill="{secrets.choice(["#141310", "#28261c", "#1d4726"])}">'
            f"{character}</text>"
        )

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}" role="img" aria-label="Captcha">'
        '<rect width="100%" height="100%" rx="10" fill="#f5f4f0"/>'
        '<path d="M0 54 C40 20 70 82 112 40 S180 52 220 22" '
        'fill="none" stroke="#ddeae0" stroke-width="9" opacity="0.8"/>'
        f'{"".join(noise_lines)}'
        f'{"".join(noise_dots)}'
        f'{"".join(characters)}'
        "</svg>"
    )
    encoded_svg = base64.b64encode(svg.encode("utf-8")).decode("ascii")
    return f"data:image/svg+xml;base64,{encoded_svg}"


def create_captcha_challenge() -> tuple[str, str, int]:
    _cleanup_captcha_store()

    challenge_id = secrets.token_urlsafe(24)
    salt = secrets.token_urlsafe(16)
    code = _captcha_code()
    _captcha_store[challenge_id] = CaptchaChallenge(
        answer_hash=_captcha_digest(challenge_id, salt, code),
        salt=salt,
        expires_at=time.time() + CAPTCHA_TTL_SECONDS,
    )

    return challenge_id, _captcha_svg_data_uri(code), CAPTCHA_TTL_SECONDS


def verify_captcha_challenge(challenge_id: str, answer: str) -> bool:
    _cleanup_captcha_store()
    challenge = _captcha_store.get(challenge_id)
    if not challenge:
        return False

    if challenge.expires_at <= time.time():
        _captcha_store.pop(challenge_id, None)
        return False

    submitted_hash = _captcha_digest(challenge_id, challenge.salt, answer)
    is_valid = hmac.compare_digest(submitted_hash, challenge.answer_hash)
    if is_valid:
        _captcha_store.pop(challenge_id, None)
        return True

    challenge.attempts += 1
    if challenge.attempts >= CAPTCHA_MAX_ATTEMPTS:
        _captcha_store.pop(challenge_id, None)
    return False


def assert_login_not_locked(key: str) -> None:
    failed_count, locked_until = _login_attempts.get(key, (0, 0))
    if locked_until > time.time():
        remaining_seconds = int(locked_until - time.time())
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Terlalu banyak percobaan login. Coba lagi dalam {remaining_seconds} detik.",
        )

    if failed_count == 0 and locked_until:
        _login_attempts.pop(key, None)


def record_login_failure(key: str) -> None:
    failed_count, locked_until = _login_attempts.get(key, (0, 0))
    if locked_until > time.time():
        return

    failed_count += 1
    if failed_count >= LOGIN_MAX_FAILED_ATTEMPTS:
        _login_attempts[key] = (failed_count, time.time() + LOGIN_LOCKOUT_SECONDS)
    else:
        _login_attempts[key] = (failed_count, 0)


def clear_login_failures(key: str) -> None:
    _login_attempts.pop(key, None)


def create_access_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    expires_at = now + timedelta(hours=TOKEN_TTL_HOURS)
    payload = {
        "sub": str(user.id),
        "username": user.username,
        "role": user.role,
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
        "iat": now,
        "nbf": now,
        "exp": expires_at,
        "jti": secrets.token_urlsafe(24),
    }
    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=JWT_ALGORITHM,
        headers={"typ": "JWT"},
    )


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=TOKEN_TTL_HOURS * 60 * 60,
        path="/",
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        secure=AUTH_COOKIE_SECURE,
        samesite=AUTH_COOKIE_SAMESITE,
    )


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            audience=JWT_AUDIENCE,
            issuer=JWT_ISSUER,
            leeway=JWT_LEEWAY_SECONDS,
            options={
                "require": ["sub", "iss", "aud", "iat", "nbf", "exp", "jti"],
            },
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sudah kedaluwarsa",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid",
        )


async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    access_token: Annotated[str | None, Cookie(alias=AUTH_COOKIE_NAME)] = None,
) -> User:
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Login diperlukan")

    payload = decode_access_token(access_token)

    try:
        user_id = uuid.UUID(payload["sub"])
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid")

    user = await crud.get_user_by_id(db, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User tidak aktif")

    if payload.get("role") != user.role or payload.get("username") != user.username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token tidak valid")

    return user


def require_role(*roles: str):
    async def dependency(user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Akses tidak diizinkan")
        return user

    return dependency
