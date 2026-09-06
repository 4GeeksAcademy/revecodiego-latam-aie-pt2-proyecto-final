"""Pydantic models for authentication and user profiles."""
from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    role: UserRole | None = None


class UserResponse(BaseModel):
    id: str
    email: str
    is_active: bool
    role: UserRole
    created_at: datetime


class ProfileCreate(BaseModel):
    user_id: str
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class ProfileUpdate(BaseModel):
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class ProfileResponse(BaseModel):
    id: str
    user_id: str
    name: str | None = None
    phone: str | None = None
    address: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MeResponse(BaseModel):
    email: str
    role: UserRole
    profile: ProfileResponse | None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)