"""TinyDB tables for authentication, stored in the API's shared database."""
from __future__ import annotations

from tinydb import TinyDB

from database import get_db

db = get_db()
users_table = db.table("users")
profiles_table = db.table("profiles")


def get_auth_db() -> TinyDB:
    """Return the shared TinyDB instance used by API modules."""
    return db