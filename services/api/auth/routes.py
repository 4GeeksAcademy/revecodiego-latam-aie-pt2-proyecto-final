"""Authentication, users, and profiles routers kept together for this module."""
from __future__ import annotations

import os

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Response, status

from auth.dependencies import get_current_user
from auth.email import send_password_reset_email
from auth.models import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MeResponse,
    ProfileResponse,
    ProfileUpdate,
    ResetPasswordRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from auth.security import create_access_token, create_reset_token, verify_password
from auth.service import (
    authenticate_user,
    create_user,
    delete_user,
    get_profile_by_user_id,
    get_user_by_id,
    get_user_by_email,
    is_reset_token_valid,
    list_users,
    mark_reset_token_used,
    store_reset_token,
    update_profile,
    update_user_password,
    update_user,
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

auth_router = APIRouter()
users_router = APIRouter()
profiles_router = APIRouter()


def _ensure_can_modify_user(current_user: dict, user_id: str) -> None:
    if current_user["id"] != user_id and current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permiso para modificar este usuario",
        )


@auth_router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest) -> TokenResponse:
    user = authenticate_user(str(login_data.email), login_data.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
        )
    return TokenResponse(access_token=create_access_token({"sub": user["id"]}))


@auth_router.get("/me", response_model=MeResponse)
def get_me(current_user: dict = Depends(get_current_user)) -> MeResponse:
    profile = get_profile_by_user_id(current_user["id"])
    return MeResponse(email=current_user["email"], role=current_user["role"], profile=profile)


@auth_router.post("/forgot-password")
def forgot_password(request: ForgotPasswordRequest, background_tasks: BackgroundTasks) -> dict[str, str]:
    user = get_user_by_email(str(request.email))
    if user is not None:
        token = create_reset_token(user["id"])
        store_reset_token(user["id"], token)
        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        background_tasks.add_task(send_password_reset_email, str(request.email), reset_link)
    return {"message": "Si esa dirección está registrada, recibirás un enlace en breve."}


@auth_router.post("/reset-password")
def reset_password(request: ResetPasswordRequest) -> dict[str, str]:
    user_id = is_reset_token_valid(request.token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de restablecimiento es inválido o ha expirado.",
        )
    update_user_password(user_id, request.new_password)
    mark_reset_token_used(request.token)
    return {"message": "Contraseña actualizada correctamente."}


@auth_router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
) -> dict[str, str]:
    user = get_user_by_id(current_user["id"])
    if user is None or not verify_password(request.current_password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta.",
        )
    update_user_password(current_user["id"], request.new_password)
    return {"message": "Contraseña actualizada correctamente."}


@users_router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate) -> dict:
    try:
        return create_user(user_data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@users_router.get("/", response_model=list[UserResponse])
def get_users(current_user: dict = Depends(get_current_user)) -> list[dict]:
    return list_users()


@users_router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, current_user: dict = Depends(get_current_user)) -> dict:
    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user


@users_router.put("/{user_id}", response_model=UserResponse)
def put_user(
    user_id: str,
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    _ensure_can_modify_user(current_user, user_id)
    user = update_user(user_id, update_data)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return user


@users_router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(user_id: str, current_user: dict = Depends(get_current_user)) -> Response:
    _ensure_can_modify_user(current_user, user_id)
    if not delete_user(user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@profiles_router.get("/me", response_model=ProfileResponse)
def get_my_profile(current_user: dict = Depends(get_current_user)) -> dict:
    profile = get_profile_by_user_id(current_user["id"])
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado")
    return profile


@profiles_router.put("/me", response_model=ProfileResponse)
def put_my_profile(
    update_data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
) -> dict:
    profile = update_profile(current_user["id"], update_data)
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil no encontrado")
    return profile