---
globs: ["uis/**"]
---

# Interfaces de usuario

## Regla

- Leer [uis/README.es.md](../../uis/README.es.md), README/manifest de la UI y reglas locales antes de tocarla. Backoffice aun no tiene README propio: usar el README padre, manifest y rutas reales, y registrar la carencia.
- Website publico futuro en `uis/website`, entrada `/`; backoffice interno existente en `uis/backoffice`, con layout propio y entrada `/`. Son apps separadas, no rutas publicas/internas improvisadas dentro del tracker. No migrar el sitio estatico raiz sin solicitud.
- `uis/talent-pipeline-tracker` es Hito 3 entregado y protegido, NO website/backoffice. Preguntar antes de editar cualquier archivo suyo; su AGENTS aplica solo alli. Leer tambien CLAUDE, Context y Design si se autoriza la tarea. Su AGENTS advierte consultar las guias de Next.js de la version instalada, no asumir APIs de otra version.
- Las dos UIs existentes usan Next.js `16.2.10` App Router, React `19.2.4`, TypeScript y Tailwind 4 declarados. Seguir las rutas `app/` existentes y `Link` para navegacion; no crear un router paralelo ni cambiar stack sin alcance explicito.
- Como referencia local real, el tracker separa `components/`, `hooks/`, `lib/`, `types/`; centraliza `fetch` con `async/await`, estado loading/success/error y etiquetas de dominio. No inventar estas carpetas como ya existentes en backoffice ni imponerle restricciones funcionales exclusivas del Hito 3 (por ejemplo notas solo en detalle).
- En el tracker no introducir librerias de estado global externas; esa restriccion proviene de su Context. En otra UI no asumir automaticamente esa prohibicion, pero no agregar dependencias sin autorizacion.
- Ejecutar `npm --prefix <ui> run lint` y `npm --prefix <ui> run build` para la UI tocada. Si faltan dependencias usar `npm --prefix <ui> ci`, sin alterar lockfiles. No hay script test declarado en estas UIs. Registrar fallos existentes en vez de ocultarlos o editar el tracker para resolver una tarea ajena.
- No copiar valores de `.env` ni secretos en UI/documentacion; `NEXT_PUBLIC_API_URL` es un nombre publico leido por codigo, no un lugar para credenciales.

## Rationale

La estructura real de Next.js y el Hito 3 ya entregado ofrecen convenciones verificables. Mantener independientes las apps preserva el alcance de cada hito y evita confundir una necesidad futura del website con una carpeta ya implementada.

## Evidence

- [uis/README.es.md](../../uis/README.es.md), [backoffice/package.json](../../uis/backoffice/package.json), [backoffice/app/layout.tsx](../../uis/backoffice/app/layout.tsx), [backoffice/app/page.tsx](../../uis/backoffice/app/page.tsx).
- [tracker/package.json](../../uis/talent-pipeline-tracker/package.json), [tracker/README.md](../../uis/talent-pipeline-tracker/README.md): scripts reales (lint/build en manifest, dev en README).
- [tracker/AGENTS.md](../../uis/talent-pipeline-tracker/AGENTS.md), [tracker/CLAUDE.md](../../uis/talent-pipeline-tracker/CLAUDE.md), [tracker/Context.md](../../uis/talent-pipeline-tracker/Context.md), [tracker/Design.md](../../uis/talent-pipeline-tracker/Design.md): reglas locales y organizacion.
- [tracker/lib/api.ts](../../uis/talent-pipeline-tracker/lib/api.ts), [tracker/lib/labels.ts](../../uis/talent-pipeline-tracker/lib/labels.ts), [tracker/types/record.ts](../../uis/talent-pipeline-tracker/types/record.ts), [tracker/hooks/useCandidate.ts](../../uis/talent-pipeline-tracker/hooks/useCandidate.ts): implementacion que respalda los patrones.
- [Context2.md](../../Context2.md), [techContext.md](../../memory-bank/techContext.md#mapa-de-carpetas): necesidades del sitio publico y existencia/ausencia de rutas.