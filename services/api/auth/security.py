"""Password hashing and JWT helpers for API authentication."""
from __future__ import annotations

import os
from datetime import datetime, timedelta

from jose import JWTError, jwt
from passlib.hash import bcrypt

# In production, these values must be supplied through the deployment .env file.
SECRET_KEY = os.getenv("SECRET_KEY", "development-only-secret-key-change-me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


def hash_password(password: str) -> str:
    """Return a bcrypt hash for a plain-text password."""
    return bcrypt.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a bcrypt hash."""
    return bcrypt.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    """Create a signed, expiring JWT containing the supplied claims."""
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Decode a JWT, returning None when it is expired, invalid, or malformed."""
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None