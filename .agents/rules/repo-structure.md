---
alwaysApply: true
---

# Estructura del monorepo

## Regla

- Leer [AGENTS.md](../../AGENTS.md), memory bank y los README de la carpeta antes de tocarla. Si falta README local, leer el padre y el manifest, y registrar la carencia.
- Nuevo codigo de aplicaciones de producto SOLO en `uis/` o `services/`. Sitio publico: `uis/website`, entrada `/` (no existe aun). App interna: `uis/backoffice`, layout propio y entrada `/` (existe). No crear `apps/`, `frontend/`, `backend/` ni nuevas apps en raiz.
- `uis/talent-pipeline-tracker` es el Hito 3 entregado en main (`edf0b3f`), no website ni backoffice. Esta protegido: preguntar antes de modificarlo y leer sus instrucciones locales si se autoriza.
- `packages/` aloja librerias/tipos reutilizables; no duplicarlos en una app. Los scripts y entregables previos en raiz se conservan; no migrarlos como efecto lateral de otra tarea.
- `agents/` y `skills/` de raiz son carpetas de producto/plantillas y capacidades del monorepo, con sus README y `_template/`. **`.agents/` es configuracion del coding agent**, no una segunda implementacion de esos productos.
- Consultar [progress.md](../../memory-bank/progress.md) antes de afirmar que existe una feature; un PR OPEN no prueba codigo integrado. Verificar `git ls-tree -r --name-only main` y el codigo del path concreto.

## Rationale

Los README existentes centralizan frontends, backends y reutilizacion. Esta politica nueva evita arboles paralelos sin reubicar entregables previos. La API y el backoffice de analisis ya estan en main aunque el PR #3 siga abierto; importa el archivo verificado, no solo el titulo de la rama.

## Evidence

- [uis/README.es.md](../../uis/README.es.md), [services/README.es.md](../../services/README.es.md), [packages/README.es.md](../../packages/README.es.md): responsabilidades de carpetas.
- [agents/README.es.md](../../agents/README.es.md), [agents/_template/README.es.md](../../agents/_template/README.es.md), [skills/README.es.md](../../skills/README.es.md), [skills/_template/SKILL.md](../../skills/_template/SKILL.md): producto y plantillas (la SKILL de plantilla esta vacia; no atribuirle instrucciones).
- [tracker/Context.md](../../uis/talent-pipeline-tracker/Context.md), [tracker/Design.md](../../uis/talent-pipeline-tracker/Design.md): Hito 3 y estructura local.
- [backoffice/app/layout.tsx](../../uis/backoffice/app/layout.tsx), [backoffice/app/page.tsx](../../uis/backoffice/app/page.tsx), [services/api/main.py](../../services/api/main.py): superficies existentes.
- [techContext.md](../../memory-bank/techContext.md#mapa-de-carpetas): inventario, estado de website y politica de ubicacion de esta entrega.