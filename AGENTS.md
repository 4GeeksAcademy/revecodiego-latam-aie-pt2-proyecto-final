# Workflow del coding agent

## Inicio de CADA sesion

Leer completos [BRIEFING.md](BRIEFING.md), [projectbrief.md](memory-bank/projectbrief.md), [techContext.md](memory-bank/techContext.md) y [progress.md](memory-bank/progress.md). El briefing es la fuente de negocio, no un placeholder. Consultar tambien los README del area a tocar y las reglas aplicables de `.agents/rules/`, aunque el cliente no cargue automaticamente su frontmatter. No tratar PRs abiertos como implementacion en main.

Este AGENTS raiz gobierna el resto del monorepo. [uis/talent-pipeline-tracker/AGENTS.md](uis/talent-pipeline-tracker/AGENTS.md) aplica solo dentro del tracker, junto con sus documentos locales; no trasladar sus reglas funcionales a website/backoffice. Sus [CLAUDE.md](uis/talent-pipeline-tracker/CLAUDE.md), [Context.md](uis/talent-pipeline-tracker/Context.md) y [Design.md](uis/talent-pipeline-tracker/Design.md) se conservan intactos. La proteccion de esa carpeta definida aqui sigue siendo obligatoria.

Actualizar [progress.md](memory-bank/progress.md) cuando cambien entregables, estado de PRs/merges, deuda, blockers, resultados de checks o proximos pasos. No inventar fechas, cobertura ni features. Cada afirmacion de negocio debe citar briefing/contexto y cada afirmacion tecnica el archivo real; separar resultados de ejecucion y politicas nuevas de hechos de implementacion.

## Flujo OBLIGATORIO antes de CADA commit

Ejecutar desde la raiz, en este orden. No usar `git add .` ni omitir checks silenciosamente.

### 1. Leer y delimitar

Leer las cuatro fuentes iniciales, README locales y reglas aplicables; verificar rama, cambios existentes y alcance. No revertir cambios ajenos.

```bash
git status -sb
git branch --show-current
git diff --name-only
```

### 2. Ejecutar los checks de lo tocado

Para documentacion agent-ready, estos checks son obligatorios (Node ya es parte del [toolchain raiz](package.json)):

```bash
cmp CONTEXT.md BRIEFING.md
node --input-type=module <<'JS'
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others',
  '--exclude-standard', '--', 'AGENTS.md', 'BRIEFING.md', 'memory-bank/', '.agents/'],
  { encoding: 'utf8' }).split('\0').filter(file => file.endsWith('.md'));
for (const file of files) {
  for (const match of fs.readFileSync(file, 'utf8').matchAll(/\]\(([^)]+)\)/g)) {
    if (/^https?:/.test(match[1])) continue;
    const target = decodeURIComponent(match[1].split('#')[0]);
    if (target && !fs.existsSync(path.resolve(path.dirname(file), target))) {
      throw new Error(`Enlace local inexistente: ${file} -> ${target}`);
    }
  }
}
console.log(`OK: ${files.length} documentos, enlaces locales existentes`);
JS
```

Si se toca producto, usar ademas los comandos existentes para su superficie:

| Area tocada | Checks obligatorios | Evidencia |
| --- | --- | --- |
| `src/**`, manifest/config TypeScript raiz | `npm run typecheck` y `npm run demo` | [package.json](package.json) |
| `validation.js` | `node --check validation.js` y verificacion manual del formulario; sintaxis no valida comportamiento | [validation.js](validation.js), [Context2.md](Context2.md) |
| `uis/backoffice/**` | `npm --prefix uis/backoffice run lint` y `npm --prefix uis/backoffice run build` | [package.json](uis/backoffice/package.json) |
| Tracker, solo con autorizacion | `npm --prefix uis/talent-pipeline-tracker run lint` y `npm --prefix uis/talent-pipeline-tracker run build` | [package.json](uis/talent-pipeline-tracker/package.json) |
| API / paquete Python de incidencias | Auditoria read-only de [verify-service-endpoints](.agents/skills/verify-service-endpoints/SKILL.md); despues ampliar checks al contrato modificado | [main.py](services/api/main.py), [pyproject.toml](packages/incidents-analysis/pyproject.toml) |

Preparacion, solo si faltan dependencias: `npm ci` en raiz o `npm --prefix <ui> ci`, sin modificar lockfiles; para Python seguir [techContext.md](memory-bank/techContext.md#comandos-reales) (virtualenv temporal y requirements desde `services/api`). No asumir un script global `test`, `lint` o `build`: no existe en el manifest raiz. Los unit tests de auth **aplican cuando se mergee #10**; releer entonces sus manifests/instrucciones y verificar el comando real, no anticiparlo.

Ante un check fallido: registrar comando, resultado y evidencia en progress. Un cambio de producto no se commitea con gates fallidos. Un commit SOLO documental puede continuar con los fallos previos ya reproducidos en [progress.md](memory-bank/progress.md#validacion-ejecutada), si sus propios checks pasan y `git diff --name-only main -- src services packages scripts uis index.html application.html validation.js` confirma que no cambia producto. No implica que el repo este verde ni autoriza a corregir producto. No repetir builds ajenos por cada cambio de texto.

### 3. Revisar staging, secretos y archivos protegidos

Agregar SOLO los paths de la tarea con `git add -- <paths-explicitos>`. Ejecutar:

```bash
git diff --cached --check
git diff --cached --name-only
git diff --cached --stat
git diff --cached --name-only -- '.env*' '**/.env*' '*lock*' '**/*lock*' \
  '.github/**' 'workflows/**' 'infra/**' 'uis/talent-pipeline-tracker/**' \
  'BRIEFING.md' 'CONTEXT.md' 'Context2.md' 'Contex3' 'company-choice.md'
if git diff --cached --no-ext-diff --unified=0 | grep -qE '^\+[^+].*(gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[A-Z0-9]{16}|sk-[A-Za-z0-9_-]{32,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)'; then
  printf '%s\n' 'STOP: posible secreto; revisar localmente sin mostrar valores'
  false
else
  printf '%s\n' 'OK: sin firmas de credenciales detectadas'
fi
```

La lista de paths protegidos debe estar vacia salvo autorizacion explicita vigente para esos paths. La creacion inicial de BRIEFING en esta tarea esta autorizada; sus ediciones futuras NO. Revisar el diff staged localmente antes de commitear: el detector es heuristico, no demuestra ausencia de secretos. No publicar el diff si contiene informacion sensible, no leer ni imprimir `.env`, y nunca introducir secretos, keys ni valores copiados de `.env` en documentos/logs. Ante deteccion, detener el commit y avisar sin reproducir el valor.

### 4. Actualizar estado y repetir checks afectados

Actualizar progress si cambio el estado segun la regla inicial; si no cambio, indicarlo en el reporte. Si se actualizo, agregar explicitamente `memory-bank/progress.md` y repetir pasos 2 y 3 para ese nuevo diff. No declarar un check aprobado que no se ejecuto. Registrar el dry-run de una skill cuando se cree o modifique.

### 5. Commit convencional y comprobacion

Usar `tipo(scope): descripcion`, por ejemplo `docs(agents): add scoped development rules`; el scope puede omitirse (`docs: add AGENTS.md with agent workflow`). Es politica nueva de esta tarea, no una convencion historica consolidada: `git log --oneline -10 main` muestra mensajes `Fase`, `Agrega`, `Hito` y merges libres.

```bash
git diff --cached --check
git commit -m "tipo(scope): descripcion concreta"
git status -sb
git log -1 --oneline
```

Reemplazar el mensaje ilustrativo por el real. No hacer push, merge, rebase ni crear ramas sin solicitud. Si un hook falla, atenderlo sin `--no-verify`.

## Protecciones y cuando preguntar

No modificar sin confirmacion explicita:

- Todo `uis/talent-pipeline-tracker/`, incluidos AGENTS, CLAUDE, Context y Design: entregable Hito 3 con instrucciones propias. Evidencia: [Context.md](uis/talent-pipeline-tracker/Context.md), historial `edf0b3f`.
- `BRIEFING.md`, `CONTEXT.md`, `Context2.md`, `Contex3`, `company-choice.md`: fuentes de negocio/alcance, no material para reescribir segun suposiciones. Evidencia: [BRIEFING.md](BRIEFING.md), [Context2.md](Context2.md), [Contex3](Contex3), [company-choice.md](company-choice.md).
- `.env*` a cualquier profundidad, tambien ejemplos, y todos los lockfiles. Los manifiestos de UIs y sus gitignore prueban configuracion independiente: [backoffice/package.json](uis/backoffice/package.json), [tracker/.gitignore](uis/talent-pipeline-tracker/.gitignore). No imprimir valores ni regenerar lockfiles incidentalmente. `npm ci` y outputs ignorados de build no son permiso para editar fuentes protegidas.
- CI/workflows (`.github/**` si se incorpora, `workflows/**`) e infraestructura/despliegues (`infra/**`): pedir alcance explicito antes de cambiar automatizaciones. Evidencia de responsabilidad: [workflows/README.es.md](workflows/README.es.md), [infra/README.es.md](infra/README.es.md); no se afirma que exista CI configurado.

Detenerse y preguntar si se necesita editar un path protegido, cambiar contrato API, dependencias/lockfiles, mover entregables previos, resolver una contradiccion de negocio o ampliar el alcance. No migrar el sitio estatico a `uis/website` sin solicitud. En esta tarea no se escribe codigo de aplicacion, no se mergean PRs y no se hace push.