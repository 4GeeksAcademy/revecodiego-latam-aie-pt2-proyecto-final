"""TinyDB initialization for the supplier directory module."""
from __future__ import annotations

from pathlib import Path

from tinydb import TinyDB

DB_PATH = Path(__file__).resolve().parent / "db.json"

_db = TinyDB(DB_PATH)

# Table dedicated to supplier directory records.
suppliers_table = _db.table("suppliers")


def get_db() -> TinyDB:
    """Return the module-level TinyDB instance."""
    return _db
