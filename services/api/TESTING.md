# AUTH-088 — Suite de tests del módulo `auth`

## 1. Cómo ejecutar los tests

```bash
# Ejecución normal (verbosa)
uv run pytest -v

# Con cobertura sobre el módulo auth
uv run pytest --cov=auth --cov-report=term-missing
```

Ambos comandos deben ejecutarse desde `services/api/`. No es necesario arrancar el servidor; los tests usan `TestClient` de FastAPI.

---

## 2. Suites de tests

| Archivo | Endpoints / funciones que cubre |
|--------|--------------------------------|
| `test_security.py` | `hash_password`, `verify_password`, `create_access_token`, `decode_access_token`, `create_reset_token`, `decode_reset_token` |
| `test_login.py` | `POST /auth/login` |
| `test_register.py` | `POST /users/` (registro) |
| `test_me.py` | `GET /auth/me` |
| `test_users_crud.py` | `GET /users/`, `GET /users/{id}`, `PUT /users/{id}`, `DELETE /users/{id}` |
| `test_profiles.py` | `GET /profiles/me`, `PUT /profiles/me` |
| `test_password_reset.py` | `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/change-password` |

---

## 3. Plan de casos por endpoint

### Seguridad (`test_security.py`)
- **hash/verify**: contraseña correcta → True, contraseña incorrecta → False.
- **Access token**: creación y decodificación exitosa (round-trip), token inválido → None, token expirado → None.
- **Reset token**: verificar `purpose="reset"` en el payload, rechazar token de sesión, token inválido → None, token expirado → None.

### Login (`test_login.py`)
- **Happy path**: email y contraseña correctos → 200 + `access_token`.
- **Contraseña incorrecta** → 401 + `"Email o contraseña incorrectos"`.
- **Email inexistente** → 401 + mismo mensaje (sin distinguir entre email/contraseña erróneos).

### Registro (`test_register.py`)
- **Happy path**: datos completos → 201, sin `password` ni `hashed_password` en respuesta.
- **Campos mínimos**: sin `name`, `phone`, `address` → 201.
- **Email duplicado** → 400 + `"Email ya registrado"`.

### Perfil propio (`test_me.py`)
- **Happy path** → 200 + `email`, `role`, `profile`.
- **Sin token** → 401.
- **Token malformado** → 401.

### CRUD de usuarios (`test_users_crud.py`)
- **GET /users/** sin auth → 401.
- **GET /users/{id}** propio → 200, **ID inexistente** → 404.
- **PUT /users/{id}** propio (cambiar email) → 200.
- **PUT /users/{id}** de otro usuario no-admin → 403.
- **DELETE /users/{id}** inexistente → 404 (después de corregir el bug).

### Perfiles (`test_profiles.py`)
- **GET /profiles/me** → 200 + datos de perfil.
- **PUT /profiles/me** (cambiar nombre) → 200.
- **Sin auth** → 401.

### Password reset (`test_password_reset.py`)
- **Forgot-password**: email existente → 200 (mensaje genérico), email inexistente → 200 (mismo mensaje genérico, no revela existencia).
- **Reset-password**: flujo completo (solicitar token → usarlo → login con nueva pass → vieja pass falla 401) → 200.
- **Token ya usado** → 400. **Token inválido** → 400.
- **Change-password**: correcto → 200, contraseña actual incorrecta → 400.
- **Change-password sin auth** → 401.

---

## 4. Cobertura actual

```
TOTAL: 301 statements, 24 missed → 92%
```

| Archivo | Cobertura |
|---------|-----------|
| `auth/email.py` | 100% |
| `auth/models.py` | 100% |
| `auth/security.py` | 100% |
| `auth/routes.py` | 91% |
| `auth/database.py` | 89% |
| `auth/dependencies.py` | 89% |
| `auth/service.py` | 84% |

**35 tests, todos pasando.** Las líneas sin cubrir corresponden principalmente a rutas de error de infraestructura difíciles de alcanzar vía HTTP: fallos internos de TinyDB al crear tablas, casos de decodificación JWT que no se disparan con tokens malformados normales, y algunos edge cases de `service.py` que requieren condiciones muy específicas.

---

## 5. Bug encontrado y corregido durante el desarrollo de tests

**Ubicación:** `auth/routes.py` — función `_ensure_can_modify_user()`.

**Problema:** Los endpoints `PUT /users/{id}` y `DELETE /users/{id}` llamaban a `_ensure_can_modify_user()` **antes** de verificar si el usuario existía. Esto provocaba que un usuario no-admin solicitando operaciones sobre un ID inexistente (ej: `DELETE /users/99999`) obtuviera un **403 Forbidden** en lugar del **404 Not Found** correcto.

**Corrección:** Se invirtió el orden de validación en ambos endpoints:

1. Primero se verifica la existencia del recurso (`get_user_by_id` → 404 si no existe).
2. Solo después se valida el permiso (`_ensure_can_modify_user` → 403 si no autorizado).

Esto además permitió simplificar `remove_user()`, ya que al confirmar la existencia previamente, `delete_user()` siempre tendrá éxito y no necesita comprobación adicional.

---

## 6. Aislamiento de base de datos

Los tests nunca modifican `services/api/db.json`. El mecanismo de aislamiento es:

- **`conftest.py`** define una fixture `_test_db` con `autouse=True` que crea una instancia de `TinyDB` con `MemoryStorage` (base de datos en memoria RAM).
- Usa `monkeypatch.setattr()` para reemplazar las referencias a las tablas tanto en `auth.database` como en `auth.service`, asegurando que **todas** las operaciones durante los tests se dirijan a la base de datos en memoria.
- Al terminar cada test, la base de datos en memoria se descarta automáticamente. El archivo `db.json` real del proyecto permanece intacto.