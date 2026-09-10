"""API routes for the centralized incidents manager."""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from auth.dependencies import get_current_user
from database import incidents_table
from models import (
    IncidentBranch,
    IncidentCategory,
    IncidentCreate,
    IncidentOrigin,
    IncidentResponse,
    IncidentStatus,
    IncidentUpdateStatus,
)

router = APIRouter()

_ALLOWED_STATUS_TRANSITIONS = {
    IncidentStatus.OPEN: {IncidentStatus.IN_PROGRESS, IncidentStatus.DISCARDED},
    IncidentStatus.IN_PROGRESS: {IncidentStatus.RESOLVED, IncidentStatus.DISCARDED},
    IncidentStatus.RESOLVED: set(),
    IncidentStatus.DISCARDED: set(),
}


class _IncidentClientError(Exception):
    def __init__(self, status_code: int, message: str, field: str | None = None) -> None:
        self.status_code = status_code
        self.message = message
        self.field = field


def _utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def _error_response(status_code: int, message: str, field: str | None = None) -> JSONResponse:
    error: dict[str, str] = {"message": message}
    if field is not None:
        error["field"] = field
    return JSONResponse(status_code=status_code, content={"error": error})


def _validation_error_response(exc: ValidationError) -> JSONResponse:
    first_error = exc.errors()[0]
    location = first_error.get("loc", [])
    field = str(location[-1]) if location else "body"
    error_type = first_error.get("type")

    if error_type == "missing":
        message = "Campo obligatorio"
    elif error_type == "enum":
        message = "Valor no válido"
    elif error_type == "extra_forbidden":
        message = "Este campo no está permitido"
    else:
        message = str(first_error.get("msg", "Valor no válido")).replace("Value error, ", "")

    return _error_response(status.HTTP_400_BAD_REQUEST, message, field)


def _parse_doc_id(raw_id: str) -> int:
    try:
        doc_id = int(raw_id)
    except ValueError as exc:
        raise _IncidentClientError(status.HTTP_400_BAD_REQUEST, "ID de incidencia inválido", "id") from exc

    if doc_id < 1:
        raise _IncidentClientError(status.HTTP_400_BAD_REQUEST, "ID de incidencia inválido", "id")
    return doc_id


def _doc_to_response(doc: dict[str, Any], doc_id: int) -> IncidentResponse:
    return IncidentResponse(id=str(doc_id), **doc)


def _parse_filter(value: str | None, enum_type: type[Enum], field: str) -> Enum | None:
    if value is None:
        return None
    try:
        return enum_type(value)
    except ValueError as exc:
        raise _IncidentClientError(status.HTTP_400_BAD_REQUEST, "Filtro no válido", field) from exc


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
def create_incident(
    payload: dict[str, Any] = Body(default_factory=dict),
    current_user: dict = Depends(get_current_user),
) -> IncidentResponse | JSONResponse:
    try:
        incident = IncidentCreate.model_validate(payload)
        now = _utc_now()
        doc = incident.model_dump(mode="json")
        doc["status"] = IncidentStatus.OPEN.value
        doc["created_at"] = now
        doc["updated_at"] = now
        doc_id = incidents_table.insert(doc)
        return _doc_to_response(doc, doc_id)
    except ValidationError as exc:
        return _validation_error_response(exc)
    except HTTPException:
        raise
    except _IncidentClientError as exc:
        return _error_response(exc.status_code, exc.message, exc.field)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno") from exc


@router.get("/summary")
def get_incidents_summary(current_user: dict = Depends(get_current_user)) -> dict[str, Any]:
    try:
        docs = incidents_table.all()
        by_status = {status_value.value: 0 for status_value in IncidentStatus}
        by_category = {category.value: 0 for category in IncidentCategory}
        by_origin = {origin.value: 0 for origin in IncidentOrigin}
        by_branch = {branch.value: 0 for branch in IncidentBranch}

        for doc in docs:
            status_value = doc.get("status")
            category = doc.get("category")
            origin = doc.get("origin")
            branch = doc.get("branch")
            if status_value in by_status:
                by_status[status_value] += 1
            if category in by_category:
                by_category[category] += 1
            if origin in by_origin:
                by_origin[origin] += 1
            if branch in by_branch:
                by_branch[branch] += 1

        return {
            "total": len(docs),
            "by_status": by_status,
            "by_category": by_category,
            "by_origin": by_origin,
            "by_branch": by_branch,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno") from exc


@router.get("", response_model=list[IncidentResponse])
def list_incidents(
    status_filter: str | None = Query(default=None, alias="status"),
    origin: str | None = None,
    branch: str | None = None,
    category: str | None = None,
    current_user: dict = Depends(get_current_user),
) -> list[IncidentResponse] | JSONResponse:
    try:
        parsed_status = _parse_filter(status_filter, IncidentStatus, "status")
        parsed_origin = _parse_filter(origin, IncidentOrigin, "origin")
        parsed_branch = _parse_filter(branch, IncidentBranch, "branch")
        parsed_category = _parse_filter(category, IncidentCategory, "category")

        results: list[IncidentResponse] = []
        for doc in incidents_table.all():
            if parsed_status is not None and doc.get("status") != parsed_status.value:
                continue
            if parsed_origin is not None and doc.get("origin") != parsed_origin.value:
                continue
            if parsed_branch is not None and doc.get("branch") != parsed_branch.value:
                continue
            if parsed_category is not None and doc.get("category") != parsed_category.value:
                continue
            results.append(_doc_to_response(doc, doc.doc_id))
        return results
    except _IncidentClientError as exc:
        return _error_response(exc.status_code, exc.message, exc.field)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno") from exc


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident(incident_id: str, current_user: dict = Depends(get_current_user)) -> IncidentResponse | JSONResponse:
    try:
        doc_id = _parse_doc_id(incident_id)
        doc = incidents_table.get(doc_id=doc_id)
        if doc is None:
            return _error_response(status.HTTP_404_NOT_FOUND, "Incidencia no encontrada", "id")
        return _doc_to_response(doc, doc.doc_id)
    except _IncidentClientError as exc:
        return _error_response(exc.status_code, exc.message, exc.field)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno") from exc


@router.patch("/{incident_id}/status", response_model=IncidentResponse)
def update_incident_status(
    incident_id: str,
    payload: dict[str, Any] = Body(default_factory=dict),
    current_user: dict = Depends(get_current_user),
) -> IncidentResponse | JSONResponse:
    try:
        doc_id = _parse_doc_id(incident_id)
        status_update = IncidentUpdateStatus.model_validate(payload)
        doc = incidents_table.get(doc_id=doc_id)
        if doc is None:
            return _error_response(status.HTTP_404_NOT_FOUND, "Incidencia no encontrada", "id")

        current_status = IncidentStatus(doc["status"])
        next_status = status_update.status
        if next_status not in _ALLOWED_STATUS_TRANSITIONS[current_status]:
            return _error_response(
                status.HTTP_400_BAD_REQUEST,
                f"Transición de estado no permitida: {current_status.value} -> {next_status.value}",
                "status",
            )

        incidents_table.update({"status": next_status.value, "updated_at": _utc_now()}, doc_ids=[doc_id])
        updated_doc = incidents_table.get(doc_id=doc_id)
        return _doc_to_response(updated_doc, updated_doc.doc_id)
    except ValidationError as exc:
        return _validation_error_response(exc)
    except _IncidentClientError as exc:
        return _error_response(exc.status_code, exc.message, exc.field)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error interno") from exc