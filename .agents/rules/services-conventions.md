---
globs: ["services/**"]
---

# Servicios

## Regla

- Leer [services/README.es.md](../../services/README.es.md), el README del servicio y sus dependencias antes de editar. En main existe `services/api`, una API FastAPI para CSV; no asumir DB, auth ni gestor por nombres de PRs.
- Mantener endpoints backend dentro de `services/`, y validacion/metricas reutilizables en el paquete existente `packages/incidents-analysis`. No copiar esas funciones a la API ni introducir otro arbol de backend.
- Para cambios en el servicio actual, respetar el contrato real: `POST /api/incidents/analyze` recibe campo multipart `file`; `GET /api/incidents/results/export` exporta metricas del ultimo analisis y devuelve 404 si no existe. No convertir errores en exito ni loguear emails/descripciones de tickets.
- La implementacion actual usa `LAST_ANALYSIS_RESULT` global en memoria y CORS wildcard. Son hechos a tener en cuenta, no recomendaciones de arquitectura segura ni prueba de persistencia. Cambios de contrato, almacenamiento, auth o dependencias requieren alcance explicito.
- Preparar un virtualenv fuera del repo; instalar desde `services/api` con `python -m pip install -r requirements.txt` usando ese interpreter. El editable relativo depende del cwd. Ejecutar la skill read-only `verify-service-endpoints` una vez disponible y ampliar validacion segun lo tocado.
- No afirmar tests de auth existentes: **aplica cuando se mergee #10**. Releer entonces los comandos reales. Los PRs #4 a #9 siguen pendientes segun el snapshot; no son evidencia de features en main.

## Rationale

La API ya delega en un paquete compartido y documenta sus dos endpoints. Usar ese contrato como punto de partida permite cambios pequenos y verificables sin confundir infraestructura propuesta con runtime existente.

## Evidence

- [services/README.es.md](../../services/README.es.md), [services/api/README.md](../../services/api/README.md): responsabilidad, instalacion y ejecucion.
- [services/api/main.py](../../services/api/main.py): endpoints, multipart, respuestas, CORS y estado en memoria.
- [requirements.txt](../../services/api/requirements.txt), [pyproject.toml](../../packages/incidents-analysis/pyproject.toml): dependencias reales sin runner de tests declarado.
- [validation.py](../../packages/incidents-analysis/incidents_analysis/validation.py), [metrics.py](../../packages/incidents-analysis/incidents_analysis/metrics.py): dueno de validacion y metricas.
- [progress.md](../../memory-bank/progress.md#pendientes-de-merge): propuestas abiertas, no features integradas.