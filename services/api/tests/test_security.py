"""Pure unit tests for auth.security — no HTTP, no database.

Tests are ordered to match the function layout in auth/security.py.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import jwt

from auth.security import (
    SECRET_KEY,
    ALGORITHM,
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    create_reset_token,
    decode_reset_token,
)


# ── hash_password / verify_password ────────────────────────────────

class TestHashing:
    def test_hash_password_and_verify_correct(self) -> None:
        hashed = hash_password("s3cret!")
        assert verify_password("s3cret!", hashed) is True

    def test_verify_password_incorrect(self) -> None:
        hashed = hash_password("s3cret!")
        assert verify_password("wrong", hashed) is False


# ── create_access_token / decode_access_token ──────────────────────

class TestAccessToken:
    def test_create_and_decode_access_token_roundtrip(self) -> None:
        token = create_access_token({"sub": "123"})
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "123"

    def test_decode_access_token_invalid_returns_none(self) -> None:
        assert decode_access_token("this.is.not.a.valid.jwt") is None

    def test_decode_access_token_expired_returns_none(self) -> None:
        payload = {
            "sub": "123",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),  # expired
        }
        expired = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        assert decode_access_token(expired) is None


# ── create_reset_token / decode_reset_token ────────────────────────

class TestResetToken:
    def test_create_reset_token_has_correct_purpose(self) -> None:
        token = create_reset_token("user-42")
        # Decode directly (not through decode_access_token) to inspect purpose
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload.get("purpose") == "password_reset"
        assert payload.get("sub") == "user-42"

    def test_decode_reset_token_rejects_session_token(self) -> None:
        session_token = create_access_token({"sub": "456"})
        assert decode_reset_token(session_token) is None

    def test_decode_reset_token_invalid_returns_none(self) -> None:
        assert decode_reset_token("garbage.token.here") is None

    def test_decode_reset_token_expired_returns_none(self) -> None:
        payload = {
            "sub": "123",
            "purpose": "password_reset",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
        }
        expired = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        assert decode_reset_token(expired) is None