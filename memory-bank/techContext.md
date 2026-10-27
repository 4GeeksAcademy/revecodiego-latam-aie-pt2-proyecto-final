# Tech Context

## Base verificada

Inspeccion del 2026-10-27: `main`, `origin/main` y el punto de partida de `feature/agent-memory-bank` son `2554cc5`. Verificado con `git status -sb`, `git branch -avv`, `git log --oneline -10`, `git ls-tree -r --name-only main` y `ls -ld uis/* services/* packages/* agents/* skills/* scripts/*`. Estos datos son un snapshot, no una garantia sobre futuros merges.

El [README raiz](../README.es.md) conserva texto de scaffolding (incluso llama placeholder al contexto); no describe el estado ejecutable actual. Prevalecen los manifests y archivos de codigo citados abajo. No se cambio ese README en esta entrega documental.

## En main: stack real

| Superficie | Framework y versiones declaradas | Evidencia |
| --- | --- | --- |
| Motor de candidatos, Hito 2 | TypeScript `^5.5.4`, tsx `^4.16.2`; modo strict, ES2020, CommonJS | [package.json](../package.json), [tsconfig.json](../tsconfig.json), [transformations.ts](../src/utils/transformations.ts) |
| Backoffice | Next.js `16.2.10`, React/React DOM `19.2.4`, TypeScript `^5`, Tailwind `^4`, ESLint `^9`, eslint-config-next `16.2.10` | [package.json](../uis/backoffice/package.json), [layout.tsx](../uis/backoffice/app/layout.tsx) |
| Talent Pipeline Tracker, Hito 3 entregado en main | Next.js `16.2.10` App Router, React/React DOM `19.2.4`, TypeScript `^5`, Tailwind `^4`, ESLint `^9` | [package.json](../uis/talent-pipeline-tracker/package.json), [README.md](../uis/talent-pipeline-tracker/README.md), [Context.md](../uis/talent-pipeline-tracker/Context.md) |
| API de analisis CSV | Python, FastAPI, Uvicorn y python-multipart sin versiones fijadas | [requirements.txt](../services/api/requirements.txt), [main.py](../services/api/main.py) |
| Paquete de incidencias | incidents-analysis `0.1.0`, Python `>=3.10`, setuptools `>=61`, sin dependencias runtime declaradas | [pyproject.toml](../packages/incidents-analysis/pyproject.toml) |
| Tipos compartidos | `@repo/shared-types` `0.0.1`, sin scripts; metadata apunta a `index.ts` pero los tipos existentes estan en `types/index.ts` | [package.json](../packages/shared/package.json), [types/index.ts](../packages/shared/types/index.ts) |

Las versiones con `^` son rangos, no versiones instaladas garantizadas. Los requirements Python no fijan versiones: no inferirlas de otro entorno. En esta verificacion se uso Node `v24.21.0`, npm `11.19.0`, Python `3.14.2`; el virtualenv temporal resolvio FastAPI `0.162.0`, Uvicorn `0.54.0` y python-multipart `0.0.32`. Son resultados de ejecucion, no nuevas restricciones del proyecto.

## Arquitectura existente, no propuesta

- La API expone `POST /api/incidents/analyze` y `GET /api/incidents/results/export`; delega validacion y metricas en el paquete compartido y conserva el ultimo resumen en `LAST_ANALYSIS_RESULT`, en memoria de proceso. Tiene CORS con origen wildcard. No implica persistencia ni autenticacion. Evidencia: [main.py](../services/api/main.py), [README.md](../services/api/README.md).
- El backoffice tiene su propio layout y entrada `/`; `/incidents` sube CSV y descarga metricas mediante `fetch`. Lee el nombre de variable `NEXT_PUBLIC_API_URL` del entorno. No se documentan valores de archivos `.env`. Evidencia: [layout.tsx](../uis/backoffice/app/layout.tsx), [page.tsx](../uis/backoffice/app/page.tsx), [incidents/page.tsx](../uis/backoffice/app/incidents/page.tsx).
- Hito 3: `edf0b3f` es ancestro de main (`git merge-base --is-ancestor edf0b3f main`). El tracker tiene `app/`, `components/`, `hooks/`, `lib/`, `types/`; consume la API publica `https://playground.4geeks.com/tracker/api/v1` documentada en su contexto (no un valor extraido de `.env`). Su cliente implementa records/notas con `async/await` y `fetch`. Evidencia: [Context.md](../uis/talent-pipeline-tracker/Context.md), [Design.md](../uis/talent-pipeline-tracker/Design.md), [api.ts](../uis/talent-pipeline-tracker/lib/api.ts).
- Convenciones locales del tracker: hooks sin estado global externo, estados loading/success/error, navegacion App Router y etiquetas legibles. Su [AGENTS.md](../uis/talent-pipeline-tracker/AGENTS.md) exige consultar las guias de la version instalada de Next.js; [CLAUDE.md](../uis/talent-pipeline-tracker/CLAUDE.md) remite a ese archivo. No generalizar todas sus restricciones funcionales a otras UIs. Evidencia adicional: [Context.md](../uis/talent-pipeline-tracker/Context.md), [Design.md](../uis/talent-pipeline-tracker/Design.md).

## Propuesto en PRs abiertos

El snapshot de PRs #3 a #10, ramas, bases y alcance anunciado esta en [progress.md](progress.md#pendientes-de-merge). No constituyen features integradas. JWT/auth (#5), UI auth (#6), password reset (#7), directorio (#4), gestor (#8), auditoria (#9) y tests de auth (#10) deben verificarse de nuevo tras merge. #9 tiene como base `feature/incidents-manager`, no main.

Excepcion importante: #3 sigue OPEN pero los archivos de analisis citados arriba ya existen en main (`ab11931`, `9c45048`, `2554cc5`). No afirmar ni que el PR esta merged ni que toda su rama esta integrada. Comprobar `git log main --oneline -- scripts/analyze.py services/api uis/backoffice packages/incidents-analysis` y el diff del PR antes de decidir que falta.

## Comandos reales

Desde la raiz, salvo donde se indica. Se ejecutaron los gates; resultados y deuda en [progress.md](progress.md#validacion-ejecutada).

| Superficie | Comandos existentes | Limites |
| --- | --- | --- |
| Raiz | `npm ci`; `npm run typecheck`; `npm run demo`; `node --check validation.js` | No hay scripts globales `test`, `lint` ni `build` en [package.json](../package.json); demo no es suite de tests |
| Backoffice | `npm --prefix uis/backoffice ci`; `npm --prefix uis/backoffice run lint`; `npm --prefix uis/backoffice run build`; `npm --prefix uis/backoffice run dev` | Scripts de [package.json](../uis/backoffice/package.json); no script test |
| Tracker protegido | `npm --prefix uis/talent-pipeline-tracker ci`; `npm --prefix uis/talent-pipeline-tracker run lint`; `npm --prefix uis/talent-pipeline-tracker run build`; `npm --prefix uis/talent-pipeline-tracker run dev` | Scripts de [package.json](../uis/talent-pipeline-tracker/package.json); README describe dev, no garantiza lint/build exitosos; no script test |
| Python | `python -m venv /tmp/nexova-agent-ready-venv`; desde `services/api`: `/tmp/nexova-agent-ready-venv/bin/python -m pip install -r requirements.txt` | El editable es relativo al cwd del requirements; [README.md](../services/api/README.md) |
| API runtime | Desde `services/api`, con virtualenv activado: `uvicorn main:app --reload --port 8000` | Comando documentado en [README.md](../services/api/README.md); no es un test |
| CLI de analisis | Con dependencia instalada: `python scripts/analyze.py scripts/incidents-nexova.csv` | Escribe `results.csv` en cwd; no ejecutarlo desde raiz para validar docs. Evidencia: [analyze.py](../scripts/analyze.py) |

No hay runner Python de tests/configuracion de lint en [requirements.txt](../services/api/requirements.txt) ni [pyproject.toml](../packages/incidents-analysis/pyproject.toml). Esta entrega preve una auditoria read-only en `.agents/skills/verify-service-endpoints/SKILL.md`, que debera validarse antes de declararla disponible. Los tests de auth aplican cuando se mergee #10: entonces releer sus comandos; no inventar un comando actual.

## Mapa de carpetas

Las rutas `/services` y `/uis` de este mapa son relativas a la raiz del repo, no al filesystem del contenedor.

| Ruta | Responsabilidad / estado verificado | Evidencia |
| --- | --- | --- |
| `./uis/website` | Destino normativo del sitio publico corporativo, entrada `/`. NO existe hoy; no crear ni migrar sin tarea autorizada | [uis/README.es.md](../uis/README.es.md), [Context2.md](../Context2.md); inventario Git |
| `./uis/backoffice` | App interna existente, layout separado y entrada `/`; analisis en `/incidents` | [layout.tsx](../uis/backoffice/app/layout.tsx), [page.tsx](../uis/backoffice/app/page.tsx) |
| `./uis/talent-pipeline-tracker` | Hito 3 entregado, independiente y protegido. NO es `uis/website` ni `uis/backoffice` | [Context.md](../uis/talent-pipeline-tracker/Context.md), [Design.md](../uis/talent-pipeline-tracker/Design.md) |
| `/uis` | Todas las interfaces frontend; existe | [uis/README.es.md](../uis/README.es.md) |
| `/services` | APIs/backends/workers; existe `api/` | [services/README.es.md](../services/README.es.md), [services/api/README.md](../services/api/README.md) |
| `packages/` | Paquetes compartidos existentes: `shared/`, `incidents-analysis/` | [packages/README.es.md](../packages/README.es.md), [pyproject.toml](../packages/incidents-analysis/pyproject.toml) |
| `agents/`, `skills/` | Carpetas de producto/plantillas y capacidades del monorepo, con README y `_template/`; NO son `.agents/` | [agents/README.es.md](../agents/README.es.md), [skills/README.es.md](../skills/README.es.md) |
| `.agents/` | Configuracion del coding agent creada en esta rama: cinco reglas; skill aun pendiente de validar. No runtime de producto | [AGENTS.md](../AGENTS.md), [repo-structure.md](../.agents/rules/repo-structure.md); contrastar con [agents/README.es.md](../agents/README.es.md) y [skills/README.es.md](../skills/README.es.md) |
| `scripts/`, `data/`, `docs/`, `infra/`, `internal/`, `mcps/`, `shared/`, `workflows/` | Superficies existentes de soporte/scaffolding; no prueba de infraestructura desplegada | [README.es.md](../README.es.md), [scripts/README.es.md](../scripts/README.es.md) |
| `src/`, `index.html`, `application.html`, `validation.js` | Entregables previos existentes en raiz, conservados; no abrir nuevos arboles similares | [package.json](../package.json), [index.html](../index.html), [application.html](../application.html), [validation.js](../validation.js) |

## Politica de ubicacion de esta entrega

Nuevo codigo de aplicaciones de producto va SOLO en `uis/` (website publico en `uis/website`, operacion interna en `uis/backoffice`) o `services/` (backends). No crear arboles paralelos `apps/`, `frontend/`, `backend/` ni nuevas apps en raiz. Los paquetes compartidos, agentes/skills de producto y herramientas existentes conservan sus responsabilidades documentadas: no duplicar ni migrar entregables previos como parte de una tarea incidental. Leer los README del directorio y sus instrucciones locales antes de tocarlo; si falta un README local (como en backoffice), leer el del padre y su manifest, y registrar la carencia. Esta es una regla operativa nueva, apoyada en [uis/README.es.md](../uis/README.es.md), [services/README.es.md](../services/README.es.md), [packages/README.es.md](../packages/README.es.md) y el inventario existente, no una afirmacion de que website ya existe.