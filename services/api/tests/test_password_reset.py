"""Integration and unit tests for password-reset flow (forgot + reset + change).

Covers POST /auth/forgot-password, /auth/reset-password, and /auth/change-password.
"""
from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient

from auth.security import create_reset_token
from auth.service import store_reset_token


class TestForgotPassword:
    def test_forgot_password_existing_email(
        self, client: TestClient, registered_user: dict, test_user_data: dict
    ) -> None:
        response = client.post(
            "/auth/forgot-password",
            json={"email": test_user_data["email"]},
        )
        assert response.status_code == 200
        assert (
            response.json()["message"]
            == "Si esa dirección está registrada, recibirás un enlace en breve."
        )

    def test_forgot_password_nonexistent_email(self, client: TestClient) -> None:
        response = client.post(
            "/auth/forgot-password",
            json={"email": f"ghost-{uuid4().hex[:8]}@example.com"},
        )
        assert response.status_code == 200
        # Same generic message — does not reveal if the email exists
        assert (
            response.json()["message"]
            == "Si esa dirección está registrada, recibirás un enlace en breve."
        )


class TestResetPassword:
    def test_reset_password_flow_success(
        self,
        client: TestClient,
        registered_user: dict,
        test_user_data: dict,
    ) -> None:
        user_id = registered_user["id"]
        # Generate a reset token programmatically (as the backend would)
        token = create_reset_token(user_id)
        store_reset_token(user_id, token)

        new_password = "newSecure456!"

        # Reset with the valid token
        response = client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": new_password},
        )
        assert response.status_code == 200

        # Login with OLD password should now fail
        old_login = client.post(
            "/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        assert old_login.status_code == 401

        # Login with NEW password should succeed
        new_login = client.post(
            "/auth/login",
            json={
                "email": test_user_data["email"],
                "password": new_password,
            },
        )
        assert new_login.status_code == 200
        assert "access_token" in new_login.json()

    def test_reset_password_token_already_used(
        self, client: TestClient, registered_user: dict
    ) -> None:
        user_id = registered_user["id"]
        token = create_reset_token(user_id)
        store_reset_token(user_id, token)

        new_password = "newSecure456!"

        # First use — succeeds
        response = client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": new_password},
        )
        assert response.status_code == 200

        # Second use with the SAME token — must fail
        response = client.post(
            "/auth/reset-password",
            json={"token": token, "new_password": new_password},
        )
        assert response.status_code == 400
        assert response.json()["detail"] == (
            "El enlace de restablecimiento es inválido o ha expirado."
        )

    def test_reset_password_invalid_token(self, client: TestClient) -> None:
        response = client.post(
            "/auth/reset-password",
            json={"token": "totally-made-up-token", "new_password": "newPass12345"},
        )
        assert response.status_code == 400
        assert response.json()["detail"] == (
            "El enlace de restablecimiento es inválido o ha expirado."
        )


class TestChangePassword:
    def test_change_password_success(
        self,
        client: TestClient,
        auth_headers: dict,
        test_user_data: dict,
    ) -> None:
        response = client.post(
            "/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": test_user_data["password"],
                "new_password": "updatedPass789!",
            },
        )
        assert response.status_code == 200

    def test_change_password_wrong_current(
        self,
        client: TestClient,
        auth_headers: dict,
    ) -> None:
        response = client.post(
            "/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "wrong-current-password",
                "new_password": "updatedPass789!",
            },
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "La contraseña actual es incorrecta."

    def test_change_password_requires_auth(self, client: TestClient) -> None:
        response = client.post(
            "/auth/change-password",
            json={
                "current_password": "whatever",
                "new_password": "updatedPass789!",
            },
        )
        assert response.status_code == 401