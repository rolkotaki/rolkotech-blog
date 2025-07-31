from datetime import datetime, timedelta, UTC
import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from typing import Any

from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    """
    Create a JWT access token with an expiration time.
    """
    expire = datetime.now(UTC) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    """
    return pwd_context.hash(password)


def generate_token(email: str) -> str:
    """
    Generate a JWT token for email verification with an expiration time.
    """
    delta = timedelta(hours=settings.EMAIL_TOKEN_EXPIRE_HOURS)
    now = datetime.now(UTC)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def verify_token(token: str) -> str | None:
    """
    Verify a JWT token and return the subject (email) if valid.
    """
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        return str(decoded_token["sub"])
    except InvalidTokenError:
        return None
