# Progress

## Snapshot y evidencia

Verificado el 2026-10-27 en `feature/agent-memory-bank`, inicialmente limpia y en `2554cc5`, igual que main y origin/main. Comandos: `git status -sb`, `git branch -avv`, `git log --oneline -10`, `git ls-tree -r --name-only main`, `ls -ld uis/* services/* packages/* agents/* skills/* scripts/*`.

Este documento distingue estado del codigo, alcance anunciado de PRs y necesidades de negocio. La lista remota se obtuvo con `gh pr list --state open --limit 30 --json number,headRefName,title,url,baseRefName`; revalidarla antes de planificar un merge.

## Entregado en main

- Sitio estatico y formulario de talento: [index.html](../index.html), [application.html](../application.html), [validation.js](../validation.js). El destino futuro `uis/website/` aun no existe; no se migro nada.
- Hito 2: motor TypeScript de candidatos y demo, con typecheck. Evidencia: [package.json](../package.json), [src/demo.ts](../src/demo.ts), [transformations.ts](../src/utils/transformations.ts).
- Hito 3 entregado en main, commit `edf0b3f`, comprobado con `git merge-base --is-ancestor edf0b3f main`: [uis/talent-pipeline-tracker/Context.md](../uis/talent-pipeline-tracker/Context.md), [package.json](../uis/talent-pipeline-tracker/package.json), [lib/api.ts](../uis/talent-pipeline-tracker/lib/api.ts). Next.js App Router + TypeScript; API publica del tracker documentada en su Context. Entregado no significa que hoy todos sus gates pasen. Es una UI separada de website y backoffice, y esta protegida.
- Analisis de incidencias ya presente: CLI (`ab11931`), paquete y API (`9c45048`), backoffice (`2554cc5`). Evidencia: [scripts/analyze.py](../scripts/analyze.py), [pyproject.toml](../packages/incidents-analysis/pyproject.toml), [services/api/main.py](../services/api/main.py), [incidents/page.tsx](../uis/backoffice/app/incidents/page.tsx). `git diff --quiet main -- services/api uis/backoffice packages/incidents-analysis` pasa en esta rama. No es un gestor centralizado ni prueba de merge del PR #3.

## Pendientes de merge

Todos OPEN en la consulta citada. "Que entrega" indica alcance anunciado por el PR, NO codigo verificado como integrado. Los enlaces son la evidencia remota de numero, rama, base y titulo; no sustituyen los archivos de main para afirmar implementacion.

| Numero | Rama | Que entrega (anunciado, pendiente) | Base |
| --- | --- | --- | --- |
| [#3](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/3) | `feature/incidents-analysis` | Analizador de incidencias: script + API + frontend; hay implementacion parcial/solapada ya en main, no asumir toda la rama integrada | `main` |
| [#4](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/4) | `feature/supplier-directory` | Directorio de proveedores (FastAPI + TinyDB + frontend) | `main` |
| [#5](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/5) | `feature/auth-api` | Autenticacion JWT y proteccion de rutas | `main` |
| [#6](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/6) | `feature/auth-frontend` | Flujos de autenticacion en frontend | `main` |
| [#7](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/7) | `feature/password-reset` | Recuperacion y cambio de contrasena | `main` |
| [#8](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/8) | `feature/incidents-manager` | Gestor de incidencias centralizado | `main` |
| [#9](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/9) | `feature/error-handling-audit` | Auditoria de error handling: backend, scripts y frontend | `feature/incidents-manager` |
| [#10](https://github.com/4GeeksAcademy/revecodiego-latam-aie-pt2-proyecto-final/pull/10) | `feature/auth-unit-tests` | Suite de unit tests para auth API; no atribuir cobertura a main | `main` |

## Validacion ejecutada

Baseline anterior a los commits documentales, con Node `v24.21.0`, npm `11.19.0`, Python `3.14.2`. Los comandos y manifests se detallan en [techContext.md](techContext.md#comandos-reales).

| Check | Resultado observado |
| --- | --- |
| `cmp CONTEXT.md BRIEFING.md` | OK, copia byte a byte; original intacto |
| `npm run typecheck` | OK |
| `npm run demo` | OK; demo, no unit tests |
| `node --check validation.js` | OK, solo sintaxis |
| `npm --prefix uis/backoffice ci --no-audit --no-fund` | OK, sin cambios de lockfile |
| `npm --prefix uis/backoffice run lint` | FAIL previo: `TypeError: Converting circular structure to JSON`; [eslint.config.mjs](../uis/backoffice/eslint.config.mjs) usa FlatCompat con presets Next |
| `npm --prefix uis/backoffice run build` | OK; rutas `/` y `/incidents` |
| `npm --prefix uis/talent-pipeline-tracker ci --no-audit --no-fund` | OK, sin cambios de lockfile |
| `npm --prefix uis/talent-pipeline-tracker run lint` | FAIL previo: cuatro errores `react-hooks/set-state-in-effect` en [page.tsx](../uis/talent-pipeline-tracker/app/candidates/[id]/page.tsx), [useCandidate.ts](../uis/talent-pipeline-tracker/hooks/useCandidate.ts), [useCandidates.ts](../uis/talent-pipeline-tracker/hooks/useCandidates.ts), [useNotes.ts](../uis/talent-pipeline-tracker/hooks/useNotes.ts) |
| `npm --prefix uis/talent-pipeline-tracker run build` | FAIL previo: `initialData` posiblemente undefined en [CandidateForm.tsx](../uis/talent-pipeline-tracker/components/CandidateForm.tsx#L158) |
| API Python | Dependencias instaladas en `/tmp/nexova-agent-ready-venv` desde [requirements.txt](../services/api/requirements.txt); auditoria read-only pendiente de ejecutar con la skill |

Las instalaciones iniciales no existian: lint primero fallo por `eslint: not found`; tras `npm ci` se obtuvieron los errores de codigo/configuracion anteriores. Ambos builds avisan de varios lockfiles e inferencia de workspace root; no se eliminaron lockfiles. Los fallos previos no se corrigieron porque esta entrega no autoriza codigo de aplicacion ni cambios al tracker.

## Deuda conocida

- [README.es.md](../README.es.md) de raiz conserva afirmaciones de plantilla que no coinciden con codigo; no usarlo como inventario actual. Falta README propio en backoffice (inventario `git ls-tree`); sus comandos se obtienen del [package.json](../uis/backoffice/package.json).
- Lint/build del tracker y lint de backoffice fallan como se detalla arriba. Pedir autorizacion antes de corregir el tracker. No desactivar reglas para ocultar fallos.
- [services/api/main.py](../services/api/main.py) guarda el ultimo analisis en memoria y configura CORS wildcard; no se verifico persistencia, auth, despliegue, ni aislamiento multiusuario. No presentarlos como resueltos por PRs abiertos.
- Dependencias Python sin pins y sin runner de tests declarado: [requirements.txt](../services/api/requirements.txt), [pyproject.toml](../packages/incidents-analysis/pyproject.toml). Ningun manifest JS inspeccionado declara script test. #10 no prueba tests en main.
- [.gitignore](../.gitignore) de raiz no excluye `.env*` globalmente; hay ejemplos ya versionados. Esta entrega no los lee ni cambia: la proteccion operativa sera revision de paths y contenido staged, sin publicar valores.
- Metadata de tipos compartidos no coincide con ubicacion del archivo: [package.json](../packages/shared/package.json), [types/index.ts](../packages/shared/types/index.ts).

## Proximos pasos

1. Completar esta entrega documental: memory bank, workflow raiz, reglas scoped, skill read-only y dry-run; preservar todos los entregables de producto.
2. Revisar diffs/dependencias de #3 a #10 y resolver la base de #9 antes de planificar merges; no mergear ni hacer push como parte de esta tarea.
3. Solicitar confirmacion para reparar gates previos y documentacion desactualizada; no migrar el sitio estatico incidentalmente.
4. Priorizar con stakeholders los objetivos del briefing: seleccion asistida, soporte RAG/knowledge base y SLA, portales y catalogo, telemetry/logging, dashboards y automatizaciones. No hay fechas ni orden obligatorio en [BRIEFING.md](../BRIEFING.md); la lista completa esta en [projectbrief.md](projectbrief.md).

## Entrega agent-ready

En curso: briefing literal y memory bank creados en `3394c16`; [AGENTS.md](../AGENTS.md) raiz creado y validado (enlaces locales y cinco pasos ordenados). Reglas scoped y skill pendientes. Los checks documentales pasan; no declarar verde el repo mientras persistan los fallos previos. Actualizar esta seccion tras el dry-run y la ejecucion final del workflow.