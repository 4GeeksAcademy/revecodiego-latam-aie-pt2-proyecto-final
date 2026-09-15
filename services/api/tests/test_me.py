"""Integration tests for GET /auth/me."""
from __future__ import annotations

from fastapi.testclient import TestClient


class TestMe:
    def test_get_me_success(
        self, client: TestClient, auth_headers: dict
    ) -> None:
        response = client.get("/auth/me", headers=auth_headers)
        assert response.status_code == 200
        body = response.json()
        assert "email" in body
        assert "role" in body
        assert "profile" in body

    def test_get_me_no_token(self, client: TestClient) -> None:
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_get_me_malformed_token(self, client: TestClient) -> None:
        response = client.get(
            "/auth/me", headers={"Authorization": "Bearer garbage-token"}
        )
        assert response.status_code == 401