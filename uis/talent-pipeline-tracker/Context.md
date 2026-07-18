# Context — Talent Pipeline Tracker (Hito 3) · Nexova

## Empresa

**Nexova** — consultora de recursos humanos y adquisición de talento, oficinas en Valencia y Miami. El negocio principal de Nexova es encontrar a las personas adecuadas para sus clientes; esta herramienta es, además de un proyecto interno, una demostración directa de las capacidades de la propia empresa. El equipo que la construye es Ingeniería de IA de Nexova.

## Resumen del reto

Elena Vargas (L&D Manager) pidió con urgencia a Sergio Molina (CTO) una herramienta de gestión de candidaturas: el proceso de selección de **Asistente de Dirección** (sede de Valencia) recibió más de 100 candidaturas y el equipo sigue en una hoja de cálculo compartida — con duplicados y estados sin actualizar hace dos semanas. El backend (API REST) ya está listo. Este proyecto es el frontend.

Se usará desde el primer día por gente real. No es un ejercicio decorativo: debe comunicar con claridad qué está pasando en cada momento (carga, éxito, error) y nunca fallar en silencio.

## Proceso de selección de referencia

| Campo | Valor |
|---|---|
| Puesto | Asistente de Dirección |
| Empresa | Nexova |
| Ubicación | Sede de Valencia |
| Perfil buscado | Experiencia en asistencia ejecutiva, gestión de agenda y viajes, inglés y español profesionales |

## Alcance funcional

- Listado de todas las candidaturas con nombre, puesto, estado y etapa actuales.
- Filtro por estado y por etapa vía query params, sin recargar la página.
- Búsqueda por nombre o email sin recargar la página.
- Detalle de una candidatura por ID, con todos sus campos.
- Cambio de estado y de etapa desde el detalle.
- Notas internas: listar, añadir, eliminar.
- Alta de nueva candidatura vía formulario.
- Edición de una candidatura existente vía formulario.
- Validación de campos requeridos y feedback de éxito/error en ambos formularios.

## Fuera de alcance

- Diseño visual pulido (no se evalúa formalmente, pero la interfaz debe ser usable y clara).
- Estado global con librerías externas (Redux, Zustand, Jotai, etc.) — prohibido explícitamente.
- Autenticación o roles de usuario (no mencionado en el reto).

## Dominio de datos (API real, confirmado contra el OpenAPI schema)

Fuente: `https://playground.4geeks.com/tracker/api/v1/openapi.json`

**Record (candidatura)**

| Campo | Tipo | Notas |
|---|---|---|
| id | string | — |
| full_name | string | requerido |
| email | string (email) | requerido |
| phone | string | requerido |
| position | string | requerido |
| linkedin_url | string \| null | opcional |
| cv_url | string \| null | opcional |
| experience_years | number | requerido |
| status | string | ver tabla de etiquetas abajo — el valor crudo nunca se muestra en la UI |
| stage | string | ver tabla de etiquetas abajo — el valor crudo nunca se muestra en la UI |
| notes_count | integer | solo lectura |
| applied_at | string (fecha) | solo lectura |
| updated_at | string (fecha) | solo lectura |

**Note**

| Campo | Tipo | Notas |
|---|---|---|
| content | string | requerido al crear |
| id, created_at | — | esperados en la respuesta de `GET /records/:id/notes`; confirmar forma exacta contra la respuesta real, el schema público no la detalla |

## Etiquetas de UI (Nexova)

Los valores que viaja la API no cambian; solo su etiqueta visible. **El valor crudo (`in_progress`, `personal_interview`, etc.) no debe aparecer nunca en la interfaz.**

`status`

| Valor API | Etiqueta en la UI |
|---|---|
| `received` | Recibida |
| `in_progress` | En proceso |
| `selected` | Seleccionada |
| `discarded` | Descartada |

`stage`

| Valor API | Etiqueta en la UI |
|---|---|
| `pending` | Pendiente de revisión |
| `review` | En revisión |
| `personal_interview` | Entrevista personal |
| `technical_interview` | Entrevista técnica |
| `offer_presented` | Oferta presentada |

## Reglas no negociables

- Next.js (App Router) + React + TypeScript únicamente.
- Sin librerías de estado externas — solo hooks a nivel de componente.
- Todas las llamadas a la API con `async/await`.
- Cada operación de fetch debe exponer al menos 3 estados de UI: loading, success, error.
- Tras `PATCH`, `PUT` o `POST`, la UI se actualiza sin recarga completa de página.
- Navegación listado↔detalle vía routing de Next.js (`Link` / `useRouter`), no enlaces planos.
- Sin prop drilling — estado acotado por componente/hook.

## Criterios de aceptación (checklist del instructor)

- [ ] Listado renderiza datos reales desde `GET /records`.
- [ ] Filtros por `status` y `stage` vía query params (`useSearchParams`), sin recarga.
- [ ] Búsqueda por nombre/email sin recarga.
- [ ] Detalle carga por ID y muestra todos los campos.
- [ ] Update de `status`/`stage` desde el detalle vía `PATCH`.
- [ ] Notas: listar, crear, eliminar desde el detalle.
- [ ] Alta de candidatura vía formulario con `POST`.
- [ ] Edición de candidatura vía formulario con `PUT`.
- [ ] Loading, éxito y error visibles en toda operación async.
- [ ] Tipos TypeScript definidos para todas las estructuras de la API.
- [ ] Estructura de carpetas: `/components`, `/hooks`, `/types`, `/lib` o `/services`.
- [ ] App Router usado correctamente para navegación y rutas dinámicas.
- [ ] Sin prop drilling.
- [ ] Estados y etapas muestran siempre etiquetas legibles (tabla Nexova), nunca el valor crudo de la API.
- [ ] Las notas internas son visibles únicamente en el detalle del candidato (no en el listado).
- [ ] El formulario de registro incluye todos los campos requeridos por la API.
