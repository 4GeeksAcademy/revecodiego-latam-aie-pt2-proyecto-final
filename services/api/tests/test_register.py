"""Integration tests for POST /users/ (registration)."""
from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient


class TestRegister:
    def test_register_success(self, client: TestClient, test_user_data: dict) -> None:
        response = client.post("/users/", json=test_user_data)
        assert response.status_code == 201
        body = response.json()
        assert "id" in body
        assert body["email"] == test_user_data["email"]
        assert body["role"] == "user"
        assert body["is_active"] is True
        # Never expose password or hash in the response
        assert "password" not in body
        assert "hashed_password" not in body

    def test_register_minimal_fields(self, client: TestClient) -> None:
        data = {
            "email": f"minimal-{uuid4().hex[:8]}@example.com",
            "password": "longenough1",
        }
        response = client.post("/users/", json=data)
        assert response.status_code == 201
        assert response.json()["email"] == data["email"]

    def test_register_duplicate_email(
        self, client: TestClient, test_user_data: dict
    ) -> None:
        client.post("/users/", json=test_user_data)
        response = client.post("/users/", json=test_user_data)
        assert response.status_code == 400
        assert response.json()["detail"] == "Email ya registrado"