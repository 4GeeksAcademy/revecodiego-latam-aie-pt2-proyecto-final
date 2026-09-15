"""Shared fixtures for the AUTH-088 test suite.

CRITICAL: every test runs against an isolated in-memory TinyDB.
The real services/api/db.json is never read or written.
"""
from __future__ import annotations

from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from tinydb import TinyDB
from tinydb.storages import MemoryStorage

from main import app


@pytest.fixture(autouse=True, scope="function")
def _test_db(monkeypatch: pytest.MonkeyPatch) -> None:
    """Replace every auth module table reference with an in-memory TinyDB.

    Because auth/database.py creates module-level globals (users_table, …) and
    auth/service.py imports them by name at import time, we must patch *both*
    modules so the function-level references are isolated per test.
    """
    memory_db = TinyDB(storage=MemoryStorage)
    users = memory_db.table("users")
    profiles = memory_db.table("profiles")
    reset_tokens = memory_db.table("password_reset_tokens")

    # Patch auth.database module-level references
    monkeypatch.setattr("auth.database.users_table", users)
    monkeypatch.setattr("auth.database.profiles_table", profiles)
    monkeypatch.setattr("auth.database.password_reset_tokens_table", reset_tokens)

    # Patch auth.service module-level references (these are copies made at import time)
    monkeypatch.setattr("auth.service.users_table", users)
    monkeypatch.setattr("auth.service.profiles_table", profiles)
    monkeypatch.setattr("auth.service.password_reset_tokens_table", reset_tokens)


@pytest.fixture(scope="function")
def client() -> TestClient:
    """Return a TestClient bound to the FastAPI application."""
    return TestClient(app)


@pytest.fixture(scope="function")
def test_user_data() -> dict:
    """Return valid registration data with a unique email per test."""
    unique = uuid4().hex[:8]
    return {
        "email": f"test-{unique}@example.com",
        "password": "securePass123",
        "name": "Test User",
        "phone": "+34612345678",
        "address": "Calle Mayor 1, Valencia",
    }


@pytest.fixture(scope="function")
def registered_user(client: TestClient, test_user_data: dict) -> dict:
    """Register a user and return the parsed JSON response."""
    response = client.post("/users/", json=test_user_data)
    assert response.status_code == 201
    return response.json()


@pytest.fixture(scope="function")
def auth_token(client: TestClient, registered_user: dict, test_user_data: dict) -> str:
    """Log in as the registered user and return the JWT access token."""
    response = client.post(
        "/auth/login",
        json={
            "email": test_user_data["email"],
            "password": test_user_data["password"],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert "access_token" in body
    return body["access_token"]


@pytest.fixture(scope="function")
def auth_headers(auth_token: str) -> dict[str, str]:
    """Return Authorization headers for the authenticated user."""
    return {"Authorization": f"Bearer {auth_token}"}