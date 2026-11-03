---
alwaysApply: true
---

# Secretos y entorno

## Regla

- Nunca incluir secretos, keys, tokens ni valores copiados de `.env` en commits, documentos, respuestas, screenshots o logs. No leer ni imprimir `.env*`, tampoco para probar un comando.
- Cualquier `.env*` (incluidos ejemplos), lockfile, CI/workflow e infraestructura requiere confirmacion explicita antes de editar. No crear un ejemplo con valores reales ni asumir permiso porque ya haya ejemplos versionados.
- Documentar solo nombres de variables que aparezcan en codigo y su finalidad. El cliente del backoffice y el del tracker leen `NEXT_PUBLIC_API_URL`: no sustituir ese nombre por un valor obtenido del entorno. Las URLs publicas del reto solo se citan desde su documentacion de contexto.
- Usar staging explicito; ejecutar el paso 3 de [AGENTS.md](../../AGENTS.md). Revisar nombres de paths y firmas sin imprimir contenido sensible. La busqueda heuristica no reemplaza la revision humana/local del diff seguro.
- Si se detecta un secreto o se requiere acceso a uno: detenerse, avisar sin reproducirlo y pedir que el usuario lo gestione fuera del chat. No probar credenciales ni hacer push.
- Instalar con `npm ci` desde lockfiles existentes; no actualizar dependencias ni lockfiles incidentalmente. Python: usar virtualenv temporal y los requirements de la superficie, no instalar tooling en el codigo de producto.

## Rationale

La API y las UIs son superficies distintas. Una variable `NEXT_PUBLIC_*` puede exponerse al browser; no debe contener secretos. El gitignore raiz no excluye globalmente `.env*`, por lo que un archivo no ignorado no es automaticamente seguro para staging. Esta regla es una proteccion nueva, no una afirmacion de que ya exista un secret scanner o CI.

## Evidence

- [.gitignore](../../.gitignore): exclusiones raiz actuales.
- [backoffice/.gitignore](../../uis/backoffice/.gitignore), [tracker/.gitignore](../../uis/talent-pipeline-tracker/.gitignore): exclusiones locales; no se necesita leer valores de entorno.
- [backoffice/incidents/page.tsx](../../uis/backoffice/app/incidents/page.tsx), [tracker/lib/api.ts](../../uis/talent-pipeline-tracker/lib/api.ts): lectura del nombre de variable publica.
- [services/api/requirements.txt](../../services/api/requirements.txt), [backoffice/package.json](../../uis/backoffice/package.json), [tracker/package.json](../../uis/talent-pipeline-tracker/package.json): dependencias por superficie.
- [AGENTS.md](../../AGENTS.md#protecciones-y-cuando-preguntar): autorizacion y workflow de seguridad.