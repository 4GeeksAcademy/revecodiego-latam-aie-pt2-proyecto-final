"""Persistence and business logic for users and profiles."""
from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Any

from tinydb import Query

from auth.database import password_reset_tokens_table, profiles_table, users_table
from auth.models import ProfileCreate, ProfileUpdate, UserCreate, UserUpdate
from auth.security import decode_reset_token, hash_password, verify_password


def _document_to_dict(document: Any) -> dict:
    return {"id": str(document.doc_id), **dict(document)}


def create_user(user_data: UserCreate) -> dict:
    """Create a user and its linked initial profile."""
    if get_user_by_email(str(user_data.email)) is not None:
        raise ValueError("Email ya registrado")

    user_id = users_table.insert(
        {
            "email": str(user_data.email),
            "hashed_password": hash_password(user_data.password),
            "is_active": True,
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )
    profile = ProfileCreate(
        user_id=str(user_id),
        name=user_data.name,
        phone=user_data.phone,
        address=user_data.address,
    )
    profiles_table.insert(profile.model_dump())
    user = get_user_by_id(str(user_id))
    if user is None:
        raise RuntimeError("No se pudo recuperar el usuario recién creado")
    return user


def get_user_by_id(user_id: str) -> dict | None:
    """Return a user by TinyDB document ID."""
    try:
        document = users_table.get(doc_id=int(user_id))
    except ValueError:
        return None
    return _document_to_dict(document) if document is not None else None


def get_user_by_email(email: str) -> dict | None:
    """Return a user matching the exact email address."""
    document = users_table.get(Query().email == email)
    return _document_to_dict(document) if document is not None else None


def list_users() -> list[dict]:
    """Return every user with its TinyDB document ID."""
    return [_document_to_dict(document) for document in users_table.all()]


def update_user(user_id: str, update_data: UserUpdate) -> dict | None:
    """Update the supplied user fields when the user exists."""
    user = get_user_by_id(user_id)
    if user is None:
        return None

    changes = update_data.model_dump(exclude_none=True)
    if "email" in changes:
        changes["email"] = str(changes["email"])
    if "role" in changes:
        changes["role"] = changes["role"].value
    if changes:
        users_table.update(changes, doc_ids=[int(user_id)])
    return get_user_by_id(user_id)


def delete_user(user_id: str) -> bool:
    """Delete a user and the profile linked to that user ID."""
    user = get_user_by_id(user_id)
    if user is None:
        return False

    users_table.remove(doc_ids=[int(user_id)])
    profiles_table.remove(Query().user_id == user_id)
    return True


def get_profile_by_user_id(user_id: str) -> dict | None:
    """Return the profile associated with a user ID."""
    document = profiles_table.get(Query().user_id == user_id)
    return _document_to_dict(document) if document is not None else None


def update_profile(user_id: str, update_data: ProfileUpdate) -> dict | None:
    """Update the non-null profile fields associated with a user ID."""
    profile = get_profile_by_user_id(user_id)
    if profile is None:
        return None

    changes = update_data.model_dump(exclude_none=True)
    if changes:
        profiles_table.update(changes, doc_ids=[int(profile["id"])])
    return get_profile_by_user_id(user_id)


def authenticate_user(email: str, password: str) -> dict | None:
    """Return a user when its credentials are valid."""
    user = get_user_by_email(email)
    if user is None or not verify_password(password, user["hashed_password"]):
        return None
    return user


def hash_token(token: str) -> str:
    """Return a non-reversible hash suitable for reset-token storage."""
    return hashlib.sha256(token.encode()).hexdigest()


def store_reset_token(user_id: str, token: str) -> None:
    """Persist an unused password-reset token hash for a user."""
    password_reset_tokens_table.insert(
        {
            "user_id": user_id,
            "token_hash": hash_token(token),
            "used": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    )


def is_reset_token_valid(token: str) -> str | None:
    """Return a user ID only for a valid, issued, unused reset token."""
    user_id = decode_reset_token(token)
    if user_id is None:
        return None

    token_record = password_reset_tokens_table.get(
        (Query().token_hash == hash_token(token)) & (Query().used == False)
    )
    return user_id if token_record is not None else None


def mark_reset_token_used(token: str) -> None:
    """Mark an issued reset token as used so it cannot be replayed."""
    password_reset_tokens_table.update(
        {"used": True},
        Query().token_hash == hash_token(token),
    )


def update_user_password(user_id: str, new_password: str) -> None:
    """Replace a user's stored password hash."""
    users_table.update(
        {"hashed_password": hash_password(new_password)},
        doc_ids=[int(user_id)],
    )