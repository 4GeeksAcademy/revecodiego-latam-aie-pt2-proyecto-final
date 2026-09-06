"""Transactional email helpers for authentication workflows."""
from __future__ import annotations

import os

import resend

resend.api_key = os.getenv("RESEND_API_KEY")


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    """Send a password reset email without exposing delivery failures to callers."""
    try:
        resend.Emails.send(
            {
                "from": "Nexova <onboarding@resend.dev>",
                "to": [to_email],
                "subject": "Restablece tu contraseña — Nexova",
                "html": f"""
                <div style="max-width: 560px; margin: 0 auto; padding: 24px; font-family: Arial, sans-serif; color: #1e293b;">
                  <p>Hola,</p>
                  <p>Recibimos una solicitud para restablecer tu contraseña de Nexova.</p>
                  <p style="margin: 28px 0;"><a href="{reset_link}" style="display: inline-block; padding: 12px 20px; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px;">Restablecer contraseña</a></p>
                  <p>Este enlace expira en 30 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
                  <p style="word-break: break-all; color: #64748b;">{reset_link}</p>
                </div>
                """,
            }
        )
    except Exception as error:
        print(f"No se pudo enviar el email de restablecimiento: {error}")