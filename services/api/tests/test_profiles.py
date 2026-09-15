"""Integration tests for /profiles/ endpoints."""
from __future__ import annotations

from fastapi.testclient import TestClient


class TestProfiles:
    def test_get_my_profile_success(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        response = client.get("/profiles/me", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert "id" in body
        assert "user_id" in body
        assert "name" in body

    def test_put_my_profile_success(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        response = client.put(
            "/profiles/me",
            headers=auth_headers,
            json={"name": "Nuevo Nombre"},
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Nuevo Nombre"

    def test_profiles_require_auth(self, client: TestClient) -> None:
        response = client.get("/profiles/me")
        assert response.status_code == 401