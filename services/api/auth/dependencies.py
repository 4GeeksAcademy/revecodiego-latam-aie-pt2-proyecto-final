"""FastAPI dependencies for authenticating bearer tokens."""
from __future__ import annotations

import logging

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from auth.security import decode_access_token
from auth.service import get_user_by_id

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Resolve the authenticated user from a valid bearer token."""
    payload = decode_access_token(token)
    if payload is None:
        logger.warning("Fallo en la autenticación: token inválido, expirado o malformado")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas o token expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = get_user_by_id(str(payload.get("sub", "")))
    if user is None:
        logger.warning("Fallo en la autenticación: usuario no encontrado en base de datos")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado",
        )

    user.pop("hashed_password", None)
    return user