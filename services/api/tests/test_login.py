"""Integration tests for POST /auth/login."""
from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient


class TestLogin:
    def test_login_success(
        self, client: TestClient, test_user_data: dict, registered_user: dict
    ) -> None:
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
        assert isinstance(body["access_token"], str)
        assert len(body["access_token"]) > 0

    def test_login_wrong_password(
        self, client: TestClient, test_user_data: dict, registered_user: dict
    ) -> None:
        response = client.post(
            "/auth/login",
            json={
                "email": test_user_data["email"],
                "password": "wrong-password-xyz",
            },
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Email o contraseña incorrectos"

    def test_login_nonexistent_email(self, client: TestClient) -> None:
        response = client.post(
            "/auth/login",
            json={
                "email": f"nonexistent-{uuid4()}@example.com",
                "password": "whatever123",
            },
        )
        assert response.status_code == 401
        # Must NOT reveal whether the email exists
        assert response.json()["detail"] == "Email o contraseña incorrectos"