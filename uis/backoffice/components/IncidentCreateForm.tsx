"use client";

import { useState } from "react";
import {
  BRANCH_LABELS,
  CATEGORY_LABELS,
  IncidentBranch,
  IncidentCategory,
  IncidentCreatePayload,
  IncidentOrigin,
  ORIGIN_LABELS,
} from "@/types/incidents";

interface IncidentCreateFormProps {
  onSuccess: () => void;
  apiErrorMessage: (payload: unknown, fallback: string) => { message: string; field?: string };
}

const CATEGORIES: IncidentCategory[] = [
  "technical_failure",
  "process_error",
  "client_complaint",
  "candidate_issue",
  "staff_issue",
  "sla_breach",
  "data_quality",
  "other",
];

const ORIGINS: IncidentOrigin[] = ["customer", "branch", "internal"];

const BRANCHES: IncidentBranch[] = [
  "central",
  "valencia_operations",
  "miami_office",
  "remote",
];

const INITIAL_FORM: IncidentCreatePayload = {
  title: "",
  description: "",
  category: "technical_failure",
  origin: "customer",
  branch: "central",
};

export function IncidentCreateForm({ onSuccess, apiErrorMessage }: IncidentCreateFormProps) {
  const [form, setForm] = useState<IncidentCreatePayload>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.title.trim()) {
      errors.title = "El título es obligatorio.";
    }
    if (!form.description.trim()) {
      errors.description = "La descripción es obligatoria.";
    }
    if (!form.category) {
      errors.category = "Selecciona una categoría.";
    }
    if (!form.origin) {
      errors.origin = "Selecciona el origen.";
    }
    if (!form.branch) {
      errors.branch = "Selecciona la sucursal.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const { apiFetch } = await import("@/lib/api-client");
      const res = await apiFetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        const parsed = apiErrorMessage(payload, "Error al registrar la incidencia.");
        if (parsed.field) {
          setFieldErrors((prev) => ({ ...prev, [parsed.field!]: parsed.message }));
        } else {
          setGlobalError(parsed.message);
        }
        return;
      }

      // Success
      setForm(INITIAL_FORM);
      setFieldErrors({});
      setSuccessMessage("Incidencia registrada con éxito.");
      onSuccess();
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch {
      setGlobalError("Error de conexión al registrar la incidencia.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Registrar Nueva Incidencia</h2>
          <p className="text-xs text-slate-500">Crea un ticket directo en el sistema centralizado de Nexova</p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {isOpen ? "Ocultar formulario" : "Nueva incidencia"}
        </button>
      </div>

      {successMessage && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
          ✓ {successMessage}
        </div>
      )}

      {globalError && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
          ✕ {globalError}
        </div>
      )}

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-xs font-bold text-slate-700">
              Título <span className="text-rose-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: "" });
              }}
              placeholder="Ej. Error de acceso a ATS"
              className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                fieldErrors.title ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
              }`}
            />
            {fieldErrors.title && <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold text-slate-700">
              Descripción detallada <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="description"
              rows={3}
              value={form.description}
              onChange={(e) => {
                setForm({ ...form, description: e.target.value });
                if (fieldErrors.description) setFieldErrors({ ...fieldErrors, description: "" });
              }}
              placeholder="Describe lo ocurrido y el impacto..."
              className={`mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                fieldErrors.description ? "border-rose-400 bg-rose-50/30" : "border-slate-300"
              }`}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="category" className="block text-xs font-bold text-slate-700">
                Categoría <span className="text-rose-500">*</span>
              </label>
              <select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as IncidentCategory })}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
              {fieldErrors.category && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.category}</p>
              )}
            </div>

            <div>
              <label htmlFor="origin" className="block text-xs font-bold text-slate-700">
                Origen <span className="text-rose-500">*</span>
              </label>
              <select
                id="origin"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value as IncidentOrigin })}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {ORIGINS.map((orig) => (
                  <option key={orig} value={orig}>
                    {ORIGINS.includes(orig) ? ORIGIN_LABELS[orig] : orig}
                  </option>
                ))}
              </select>
              {fieldErrors.origin && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.origin}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="branch"
                className={`block text-xs font-bold ${
                  form.origin === "branch" ? "text-amber-800" : "text-slate-700"
                }`}
              >
                Sucursal {form.origin === "branch" ? "(Origen de sucursal destacado)" : ""}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <select
                id="branch"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value as IncidentBranch })}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 ${
                  form.origin === "branch"
                    ? "border-amber-400 bg-amber-50/50 ring-1 ring-amber-300"
                    : "border-slate-300 bg-white"
                }`}
              >
                {BRANCHES.map((br) => (
                  <option key={br} value={br}>
                    {BRANCH_LABELS[br]}
                  </option>
                ))}
              </select>
              {fieldErrors.branch && (
                <p className="mt-1 text-xs text-rose-600">{fieldErrors.branch}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setForm(INITIAL_FORM);
                setFieldErrors({});
                setGlobalError(null);
                setIsOpen(false);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Registrando...
                </span>
              ) : (
                "Guardar incidencia"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
