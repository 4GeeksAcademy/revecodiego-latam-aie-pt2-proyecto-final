"""Integration tests for /users/ CRUD endpoints."""
from __future__ import annotations

from uuid import uuid4

from fastapi.testclient import TestClient


class TestUsersCRUD:
    def test_get_users_requires_auth(self, client: TestClient) -> None:
        response = client.get("/users/")
        assert response.status_code == 401

    def test_get_user_by_id_success(
        self, client: TestClient, registered_user: dict, auth_headers: dict
    ) -> None:
        user_id = registered_user["id"]
        response = client.get(f"/users/{user_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == user_id

    def test_get_user_not_found(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        response = client.get("/users/99999", headers=auth_headers)
        assert response.status_code == 404

    def test_put_user_own_account(
        self,
        client: TestClient,
        registered_user: dict,
        auth_headers: dict,
        test_user_data: dict,
    ) -> None:
        user_id = registered_user["id"]
        new_email = f"updated-{uuid4().hex[:8]}@example.com"
        response = client.put(
            f"/users/{user_id}",
            headers=auth_headers,
            json={"email": new_email},
        )
        assert response.status_code == 200
        assert response.json()["email"] == new_email

    def test_put_user_forbidden_other_account(
        self,
        client: TestClient,
        auth_headers: dict,
        registered_user: dict,
    ) -> None:
        """Register a second user and try to update it with the first user's token."""
        second_data = {
            "email": f"other-{uuid4().hex[:8]}@example.com",
            "password": "otherPass123",
        }
        second_resp = client.post("/users/", json=second_data)
        second_id = second_resp.json()["id"]

        response = client.put(
            f"/users/{second_id}",
            headers=auth_headers,
            json={"email": "new@example.com"},
        )
        assert response.status_code == 403

    def test_delete_user_not_found(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        response = client.delete("/users/99999", headers=auth_headers)
        assert response.status_code == 404