"""Pydantic models for the supplier directory module."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, model_validator

VALID_CATEGORIES = [
    "job_boards",
    "ats_software",
    "assessment_tools",
    "training_platforms",
    "payroll_and_hr_software",
    "video_interview",
    "background_check",
    "office_and_facilities",
    "it_and_software_licenses",
]


class SupplierStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"


def _validate_categories(categories: list[str]) -> list[str]:
    if not categories:
        raise ValueError("categories must contain at least 1 element")
    invalid = [c for c in categories if c not in VALID_CATEGORIES]
    if invalid:
        raise ValueError(f"invalid categories: {invalid}. Valid options: {VALID_CATEGORIES}")
    return categories


def _validate_contract_renewal_date(value: Optional[str]) -> Optional[str]:
    if value is None:
        return value
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError as exc:
        raise ValueError("contract_renewal_date must be in 'YYYY-MM-DD' format") from exc
    return value


class _SupplierCurrencyValidatorMixin(BaseModel):
    """Shared business rule: Spain -> EUR, USA -> USD."""

    @model_validator(mode="after")
    def _validate_country_currency(self) -> "_SupplierCurrencyValidatorMixin":
        if self.country == "Spain" and self.currency != "EUR":
            raise ValueError("country=Spain requiere currency=EUR")
        if self.country == "USA" and self.currency != "USD":
            raise ValueError("country=USA requiere currency=USD")
        return self


class SupplierCreate(_SupplierCurrencyValidatorMixin):
    name: str = Field(..., min_length=1)
    country: Literal["Spain", "USA"]
    categories: list[str] = Field(..., min_length=1)
    monthly_rate: float = Field(..., gt=0)
    currency: Literal["EUR", "USD"]
    status: SupplierStatus = SupplierStatus.ACTIVE
    contract_renewal_date: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def _validate_fields(self) -> "SupplierCreate":
        _validate_categories(self.categories)
        _validate_contract_renewal_date(self.contract_renewal_date)
        return self


class SupplierUpdateRate(BaseModel):
    monthly_rate: float = Field(..., gt=0)


class SupplierUpdateStatus(BaseModel):
    status: SupplierStatus


class SupplierResponse(_SupplierCurrencyValidatorMixin):
    id: str
    name: str = Field(..., min_length=1)
    country: Literal["Spain", "USA"]
    categories: list[str] = Field(..., min_length=1)
    monthly_rate: float = Field(..., gt=0)
    currency: Literal["EUR", "USD"]
    updated_at: datetime
    status: SupplierStatus
    contract_renewal_date: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None

    @model_validator(mode="after")
    def _validate_fields(self) -> "SupplierResponse":
        _validate_categories(self.categories)
        _validate_contract_renewal_date(self.contract_renewal_date)
        return self
