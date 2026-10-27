---
name: verify-service-endpoints
description: "Audita en modo read-only el contrato existente de analisis y export CSV de services/api antes de documentarlo o proponer cambios."
---

# Verificar endpoints de incidencias

## Objective

Verificar de forma reproducible el contrato actual de analisis y exportacion CSV sin modificar codigo, datos ni configuracion de producto.

## Inputs

Ejecutar desde la raiz del monorepo. Inputs no sensibles, con ejemplo probado:

| Input | Significado | Ejemplo |
| --- | --- | --- |
| `API_DIR` | Servicio existente con `main.py` y `requirements.txt`; no una URL remota | `services/api` |
| `INCIDENTS_CSV` | Fixture local del repo; no usar datos de produccion ni imprimir filas | `scripts/incidents-nexova.csv` |
| `PYTHON` | Interpreter absoluto de virtualenv con requirements del servicio; Python >=3.10 segun paquete | `/tmp/nexova-agent-ready-venv/bin/python` |

```bash
export API_DIR=services/api
export INCIDENTS_CSV=scripts/incidents-nexova.csv
export PYTHON=/tmp/nexova-agent-ready-venv/bin/python
```

El contrato esperado es el de [main.py](../../../services/api/main.py): `POST /api/incidents/analyze` y `GET /api/incidents/results/export`. No extender esta skill a auth/proveedores por el titulo de un PR. Si el contrato cambia autorizadamente, adaptar assertions y documentar esa evidencia, no eliminar checks para obtener verde.

## Steps

### 1. Leer evidencia y tomar baseline

Leer [AGENTS.md](../../../AGENTS.md), los tres documentos de [memory bank](../../../memory-bank/projectbrief.md), [BRIEFING.md](../../../BRIEFING.md), [services/README.es.md](../../../services/README.es.md), [services/api/README.md](../../../services/api/README.md) y [services-conventions.md](../../rules/services-conventions.md). No leer `.env`.

```bash
git status -sb
git diff --name-only
grep -nE '^@app\.(get|post|put|patch|delete)' "$API_DIR/main.py"
```

Anotar los paths ya modificados. No revertirlos ni atribuirlos a la skill. El decorator es evidencia de routing, no prueba suficiente de comportamiento.

### 2. Preparar dependencias aisladas si faltan

Solo si el virtualenv aun no esta preparado:

```bash
python -m venv /tmp/nexova-agent-ready-venv
pushd "$API_DIR"
"$PYTHON" -m pip install -r requirements.txt
popd
```

No actualizar manifests, lockfiles ni instalar `pytest`/`httpx`: esta auditoria usa stdlib y las dependencias actuales del servicio. El editable relativo del requirements necesita ese cwd. Si falta acceso a paquetes, informar el bloqueo; no declarar un dry-run exitoso sin ejecutar las assertions.

### 3. Ejecutar auditoria en memoria

Invoca funciones Python directamente y consume el stream exportado. No necesita servidor, red hacia APIs ni modificaciones en disco; desactiva bytecode. No equivale a test HTTP/ASGI de extremo a extremo.

```bash
PYTHONDONTWRITEBYTECODE=1 "$PYTHON" - <<'PY'
import ast
import asyncio
import csv
import importlib
import io
import os
from pathlib import Path
import sys

api_dir = Path(os.environ["API_DIR"]).resolve()
fixture = Path(os.environ["INCIDENTS_CSV"]).resolve()
ast.parse((api_dir / "main.py").read_text(encoding="utf-8"))
sys.path.insert(0, str(api_dir))
service = importlib.import_module("main")
from fastapi import UploadFile

expected_routes = {
    ("POST", "/api/incidents/analyze"),
    ("GET", "/api/incidents/results/export"),
}
actual_routes = {
    (method, route.path)
    for route in service.app.routes
    for method in getattr(route, "methods", set())
}
assert expected_routes <= actual_routes, "Faltan rutas esperadas"
schema = service.app.openapi()
upload_content = schema["paths"]["/api/incidents/analyze"]["post"]["requestBody"]["content"]
assert "multipart/form-data" in upload_content, "Contrato multipart ausente"

async def audit():
    service.LAST_ANALYSIS_RESULT = None
    assert service.export_last_results().status_code == 404
    assert (await service.analyze_incidents(None)).status_code == 400
    for content in (b"", b"\xff", b"wrong_header\nvalue\n"):
        upload = UploadFile(filename="invalid.csv", file=io.BytesIO(content))
        assert (await service.analyze_incidents(upload)).status_code == 400
    content = fixture.read_bytes()
    input_rows = list(csv.DictReader(io.StringIO(content.decode("utf-8"))))
    assert input_rows, "Fixture vacia"
    upload = UploadFile(filename=fixture.name, file=io.BytesIO(content))
    summary = await service.analyze_incidents(upload)
    assert isinstance(summary, dict), "Analisis sin resumen"
    totals = summary["totals"]
    assert totals["total_records"] == len(input_rows)
    assert totals["valid_records"] + totals["invalid_records"] == len(input_rows)
    response = service.export_last_results()
    assert response.status_code == 200
    chunks = []
    async for chunk in response.body_iterator:
        chunks.append(chunk.decode("utf-8") if isinstance(chunk, bytes) else chunk)
    reader = csv.DictReader(io.StringIO("".join(chunks)))
    assert reader.fieldnames == ["metric", "value"]
    metrics = {row["metric"]: row["value"] for row in reader}
    for name in ("total_records", "valid_records", "invalid_records"):
        assert int(metrics[name]) == totals[name], f"Metrica inconsistente: {name}"
    print(f"OK: 2 rutas, multipart, 404 inicial, 4 errores 400, analisis y export; filas={len(input_rows)}")

asyncio.run(audit())
PY
```

### 4. Comprobar ausencia de cambios y registrar resultado

```bash
git status -sb
git diff --name-only
```

Comparar con el baseline. Para el dry-run SOLO documental de esta entrega, ejecutar tambien:

```bash
git diff --quiet main -- services packages scripts uis src index.html application.html validation.js
```

Un exit code 0 confirma que producto sigue igual a main. En usos futuros sobre cambios autorizados, comparar contra el baseline previo de la tarea, no exigir que cambios ajenos desaparezcan. Registrar en [progress.md](../../../memory-bank/progress.md) comando, resultado y limitaciones; ejecutar el workflow raiz antes de cualquier commit documental. No hacer push.

## Expected output

- Exit code 0 y una linea `OK: 2 rutas, multipart, 404 inicial, 4 errores 400, analisis y export; filas=<cantidad del fixture>`.
- Ningun contenido de tickets, email, descripcion, secreto ni valor de `.env` en la salida.
- Ningun cambio a producto, fixtures, resultados CSV, documentos protegidos ni lockfiles; solo el reporte documental autorizado puede cambiar.

## Acceptance criteria

| Criterio | Comando o check concreto |
| --- | --- |
| Input y fuente existen | `[[ -f "$API_DIR/main.py" && -f "$INCIDENTS_CSV" && -x "$PYTHON" ]]` |
| Sintaxis, rutas y multipart correctos | `ast.parse`, assertion de `expected_routes` y de OpenAPI en paso 3; exit code 0 |
| Export sin analisis devuelve 404 | Primera assertion de `audit()` |
| Archivo ausente, vacio, UTF-8 invalido y header incorrecto devuelven 400 | Cuatro assertions de entradas invalidas en `audit()` |
| Analisis conserva cantidad de filas | Assertions de `total_records` y suma de validos/invalidos |
| Export es CSV de metricas coherentes | Assertions de status 200, headers `metric,value` y tres totales |
| No se modifico producto durante el dry-run | Comparacion baseline/estado del paso 4; en esta entrega `git diff --quiet main -- services packages scripts uis src index.html application.html validation.js` |
| Resultado queda documentado sin datos sensibles | Revisar seccion de validacion en progress y paso 3 de AGENTS (scanner heuristico + revision local) |

## Evidence

[services/api/main.py](../../../services/api/main.py), [services/api/README.md](../../../services/api/README.md), [requirements.txt](../../../services/api/requirements.txt), [pyproject.toml](../../../packages/incidents-analysis/pyproject.toml), [validation.py](../../../packages/incidents-analysis/incidents_analysis/validation.py), [metrics.py](../../../packages/incidents-analysis/incidents_analysis/metrics.py), [fixture CSV](../../../scripts/incidents-nexova.csv). Esta skill no certifica concurrencia, persistencia, seguridad de CORS ni integracion HTTP; tampoco tests/cobertura de auth del PR #10.