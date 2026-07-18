# Design — Talent Pipeline Tracker · Nexova

Complementa a `Context.md`. Este documento define la arquitectura técnica: estructura de carpetas, capa de datos, tipos, y el diseño de cada pantalla.

## Stack

- Next.js (App Router), TypeScript, Tailwind CSS, ESLint.
- `fetch` nativo envuelto en una capa de servicios propia — sin librerías HTTP externas.
- Sin librerías de estado global (Redux/Zustand/Jotai prohibidas). Solo `useState`/`useReducer`/hooks propios.

## Variables de entorno

```
NEXT_PUBLIC_API_URL=https://playground.4geeks.com/tracker/api/v1
```

`.env.local` no se commitea; `.env.example` documenta la variable de arriba.

## Estructura de carpetas

```
uis/talent-pipeline-tracker/
├── app/
│   ├── page.tsx                    # listado (/)
│   ├── candidates/[id]/page.tsx    # detalle (/candidates/[id])
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── CandidateList.tsx
│   ├── CandidateRow.tsx
│   ├── FiltersBar.tsx              # status + stage + search
│   ├── CandidateForm.tsx           # compartido create/edit
│   ├── StatusBadge.tsx
│   ├── StatusSelector.tsx
│   ├── StageSelector.tsx
│   ├── NotesPanel.tsx
│   ├── NoteItem.tsx
│   ├── LoadingState.tsx
│   └── ErrorState.tsx
├── hooks/
│   ├── useCandidates.ts            # listado + filtros
│   ├── useCandidate.ts             # un registro por id
│   └── useNotes.ts                 # CRUD de notas
├── lib/                            # (o /services)
│   └── api.ts                      # cliente fetch tipado por endpoint
├── types/
│   └── record.ts                   # Record, RecordCreateInput, RecordPatchInput, Note
├── lib/labels.ts                   # mapeo status/stage -> etiqueta Nexova (ver abajo)
├── .env.local
└── .env.example
```

## Capa de datos — `lib/api.ts`

Cliente fetch centralizado, sin estado propio (funciones puras async):

- `getRecords(filters: { status?, stage?, search?, page?, limit? })` → `GET /records`
- `getRecord(id: string)` → `GET /records/:id`
- `createRecord(data: RecordCreateInput)` → `POST /records`
- `replaceRecord(id: string, data: RecordCreateInput)` → `PUT /records/:id`
- `patchRecord(id: string, data: RecordPatchInput)` → `PATCH /records/:id`
- `getNotes(id: string)` → `GET /records/:id/notes`
- `addNote(id: string, content: string)` → `POST /records/:id/notes`
- `deleteNote(id: string, noteId: string)` → `DELETE /records/:id/notes/:note_id`

Cada función lanza un error tipado (`{ message: string; status: number }`) en respuestas no-2xx; los hooks lo capturan y lo exponen como estado de error.

## Tipos — `types/record.ts`

```ts
export type RecordStatus = "received" | "in_progress" | "selected" | "discarded";
export type RecordStage =
  | "pending"
  | "review"
  | "personal_interview"
  | "technical_interview"
  | "offer_presented";

export interface Record {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  experience_years: number;
  status: RecordStatus;
  stage: RecordStage;
  notes_count: number;
  applied_at: string;
  updated_at: string;
}

export interface RecordCreateInput {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url?: string | null;
  cv_url?: string | null;
  experience_years: number;
}

export interface RecordPatchInput {
  status?: RecordStatus;
  stage?: RecordStage;
}

export interface Note {
  id: string;
  content: string;
  created_at: string;
}
```

## Etiquetas de UI — `lib/labels.ts`

Los componentes nunca imprimen `record.status` o `record.stage` directamente — siempre pasan por este mapeo. Evita que el valor crudo de la API se filtre a la interfaz.

```ts
import type { RecordStatus, RecordStage } from "@/types/record";

export const statusLabels: Record<RecordStatus, string> = {
  received: "Recibida",
  in_progress: "En proceso",
  selected: "Seleccionada",
  discarded: "Descartada",
};

export const stageLabels: Record<RecordStage, string> = {
  pending: "Pendiente de revisión",
  review: "En revisión",
  personal_interview: "Entrevista personal",
  technical_interview: "Entrevista técnica",
  offer_presented: "Oferta presentada",
};
```

`StatusBadge`, `StatusSelector` y `StageSelector` importan estos diccionarios: muestran `statusLabels[value]` / `stageLabels[value]` como texto visible, pero siguen enviando el valor crudo (`value`) en el `PATCH`. Los `<select>` de cambio de estado/etapa listan las claves de estos objetos como `option value` con la etiqueta como texto.

## Patrón de estado async

Todo hook de lectura expone la misma forma:

```ts
{ data, isLoading, error, refetch }
```

Todo hook de mutación expone:

```ts
{ mutate, isSubmitting, error }
```

Renderizado condicional en los componentes: `isLoading` → skeleton/spinner, `error` → `ErrorState` con mensaje humano y opción de reintentar, `data` presente → contenido. Ninguna mutación exitosa dispara `window.location.reload()`; se actualiza el estado local (optimista o `refetch`).

## Listado — `app/page.tsx`

- `useSearchParams` lee `status`, `stage`, `q` de la URL; `useRouter().replace` los escribe al cambiar un filtro.
- `useCandidates(filters)` llama `GET /records` con `status`/`stage`/`search` como query params.
- La búsqueda por nombre/email usa el parámetro `search` que la API ya soporta (confirmado en el schema) — no requiere filtrado client-side adicional, pero conviene aplicar debounce simple al input antes de disparar el fetch.
- Cada fila usa `<Link href={`/candidates/${id}`}>` para navegar sin recarga.
- `FiltersBar` es un componente controlado que solo lee/escribe la URL; no guarda estado propio de filtros.

## Detalle — `app/candidates/[id]/page.tsx`

- `useCandidate(id)` llama `GET /records/:id` al montar.
- `StatusSelector` / `StageSelector`: al cambiar, llaman `patchRecord(id, { status })` o `{ stage }`; al resolver, actualizan el registro en estado local con la respuesta (no recargan la página ni vuelven a pedir todo el listado).
- `NotesPanel` usa `useNotes(id)`: `GET` al montar; `POST` añade una nota y la antepone a la lista local; `DELETE` la remueve de la lista local tras confirmar éxito. Las notas solo se renderizan en esta vista de detalle — no deben aparecer ni filtrarse al listado (`CandidateList`/`CandidateRow`).
- Un botón/link lleva a modo edición reutilizando `CandidateForm` con `mode="edit"` e `initialData` precargado, enviando `PUT`.

## Formularios — `CandidateForm.tsx`

- Componente único con prop `mode: "create" | "edit"` y `initialData?: Record`.
- Valida antes de enviar: `full_name`, `email`, `phone`, `position`, `experience_years` requeridos; mensajes de error inline por campo.
- Al enviar: estado `isSubmitting` deshabilita el botón; en error muestra el mensaje devuelto por la API (422 trae detalle por campo); en éxito muestra confirmación y redirige (`create` → detalle del nuevo registro; `edit` → detalle actualizado).

## Manejo de errores

- El wrapper de `lib/api.ts` normaliza errores de red y de validación (422) en un objeto consistente.
- `ErrorState` es el único componente que renderiza mensajes de error de fetch; en formularios, los errores de validación 422 se mapean campo a campo cuando la respuesta lo permite, y como mensaje general si no.

## Copy y tono (Nexova)

- Título del listado / cabecera: referencia al proceso de selección en curso — "Asistente de Dirección · Sede Valencia" (o similar), no un título genérico como "Candidates".
- Mensajes vacíos y de error en español, tono profesional interno (equipo de Ingeniería de IA construyendo para People/L&D de la propia empresa).
- Formulario de alta debe cubrir los mismos campos requeridos por la API (`full_name`, `email`, `phone`, `position`, `experience_years`, más `linkedin_url`/`cv_url` opcionales) — Elena pidió explícitamente poder "registrar candidatos que llegan por otras vías y corregir datos cuando vienen mal".
