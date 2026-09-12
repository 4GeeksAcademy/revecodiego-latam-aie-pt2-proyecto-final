"""API routes for the supplier directory module."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import JSONResponse

from auth.dependencies import get_current_user
from database import suppliers_table
from models import SupplierCreate, SupplierResponse, SupplierUpdateRate, SupplierUpdateStatus

router = APIRouter()


def _error_response(status_code: int, message: str, field: str | None = None) -> JSONResponse:
    error: dict[str, str] = {"message": message}
    if field is not None:
        error["field"] = field
    return JSONResponse(status_code=status_code, content={"error": error})


def _parse_supplier_id(raw_id: str) -> int:
    try:
        doc_id = int(raw_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de proveedor inválido",
        ) from exc

    if doc_id < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID de proveedor inválido",
        )
    return doc_id


def _doc_to_response(doc: dict[str, Any], doc_id: int) -> SupplierResponse:
    return SupplierResponse(id=str(doc_id), **doc)


@router.post("", response_model=SupplierResponse, status_code=status.HTTP_201_CREATED)
def create_supplier(supplier: SupplierCreate, current_user: dict = Depends(get_current_user)) -> SupplierResponse:
    doc = supplier.model_dump()
    doc["status"] = doc["status"].value
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    doc_id = suppliers_table.insert(doc)
    return _doc_to_response(doc, doc_id)


@router.get("", response_model=list[SupplierResponse])
def list_suppliers(
    country: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
) -> list[SupplierResponse]:
    docs = suppliers_table.all()
    results: list[SupplierResponse] = []
    for doc in docs:
        if country is not None and doc.get("country") != country:
            continue
        if category is not None and category not in doc.get("categories", []):
            continue
        results.append(_doc_to_response(doc, doc.doc_id))
    return results


@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: str, current_user: dict = Depends(get_current_user)):
    doc_id = _parse_supplier_id(supplier_id)
    doc = suppliers_table.get(doc_id=doc_id)
    if doc is None:
        return _error_response(status.HTTP_404_NOT_FOUND, "Proveedor no encontrado")
    return _doc_to_response(doc, doc.doc_id)


@router.patch("/{supplier_id}/rate", response_model=SupplierResponse)
def update_supplier_rate(
    supplier_id: str,
    payload: SupplierUpdateRate,
    current_user: dict = Depends(get_current_user),
):
    doc_id = _parse_supplier_id(supplier_id)
    doc = suppliers_table.get(doc_id=doc_id)
    if doc is None:
        return _error_response(status.HTTP_404_NOT_FOUND, "Proveedor no encontrado")
    updated_at = datetime.now(timezone.utc).isoformat()
    suppliers_table.update(
        {"monthly_rate": payload.monthly_rate, "updated_at": updated_at}, doc_ids=[doc_id]
    )
    doc = suppliers_table.get(doc_id=doc_id)
    return _doc_to_response(doc, doc.doc_id)


@router.patch("/{supplier_id}/status", response_model=SupplierResponse)
def update_supplier_status(
    supplier_id: str,
    payload: SupplierUpdateStatus,
    current_user: dict = Depends(get_current_user),
):
    doc_id = _parse_supplier_id(supplier_id)
    doc = suppliers_table.get(doc_id=doc_id)
    if doc is None:
        return _error_response(status.HTTP_404_NOT_FOUND, "Proveedor no encontrado")
    suppliers_table.update({"status": payload.status.value}, doc_ids=[doc_id])
    doc = suppliers_table.get(doc_id=doc_id)
    return _doc_to_response(doc, doc.doc_id)


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: str, current_user: dict = Depends(get_current_user)):
    doc_id = _parse_supplier_id(supplier_id)
    doc = suppliers_table.get(doc_id=doc_id)
    if doc is None:
        return _error_response(status.HTTP_404_NOT_FOUND, "Proveedor no encontrado")
    suppliers_table.remove(doc_ids=[doc_id])
    return Response(status_code=status.HTTP_204_NO_CONTENT)
