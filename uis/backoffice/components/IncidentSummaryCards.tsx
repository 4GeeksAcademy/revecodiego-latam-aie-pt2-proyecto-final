"use client";

import { IncidentSummary } from "@/types/incidents";

interface IncidentSummaryCardsProps {
  summary: IncidentSummary | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function IncidentSummaryCards({
  summary,
  loading,
  error,
  onRetry,
}: IncidentSummaryCardsProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Resumen de Métricas</h2>
          <span className="text-xs text-slate-500">Cargando métricas...</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100 p-4" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-rose-900">Error al cargar métricas</h2>
            <p className="mt-1 text-sm text-rose-700">{error}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            Reintentar métricas
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Resumen de Incidencias</h2>
          <p className="text-xs text-slate-500">Métricas agregadas del centro de operaciones</p>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">
          Total: {summary.total}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Por Estado</p>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Abiertas
              </span>
              <span className="font-semibold text-slate-900">{summary.by_status.open ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> En progreso
              </span>
              <span className="font-semibold text-slate-900">{summary.by_status.in_progress ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Resueltas
              </span>
              <span className="font-semibold text-slate-900">{summary.by_status.resolved ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="h-2 w-2 rounded-full bg-slate-400" /> Descartadas
              </span>
              <span className="font-semibold text-slate-900">{summary.by_status.discarded ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Category Highlights */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Por Categoría</p>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Fallo técnico</span>
              <span className="font-semibold text-slate-900">{summary.by_category.technical_failure ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Error de proceso</span>
              <span className="font-semibold text-slate-900">{summary.by_category.process_error ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Reclamación cliente</span>
              <span className="font-semibold text-slate-900">{summary.by_category.client_complaint ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Otras categorías</span>
              <span className="font-semibold text-slate-900">
                {(summary.by_category.candidate_issue ?? 0) +
                  (summary.by_category.staff_issue ?? 0) +
                  (summary.by_category.sla_breach ?? 0) +
                  (summary.by_category.data_quality ?? 0) +
                  (summary.by_category.other ?? 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Origin Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Por Origen</p>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Cliente (Customer)</span>
              <span className="font-semibold text-slate-900">{summary.by_origin.customer ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Sucursal (Branch)</span>
              <span className="font-semibold text-slate-900">{summary.by_origin.branch ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Interno (Internal)</span>
              <span className="font-semibold text-slate-900">{summary.by_origin.internal ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Branch Breakdown */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Por Sucursal</p>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Valencia — Central</span>
              <span className="font-semibold text-slate-900">{summary.by_branch.central ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Valencia — Operaciones</span>
              <span className="font-semibold text-slate-900">{summary.by_branch.valencia_operations ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Miami Office</span>
              <span className="font-semibold text-slate-900">{summary.by_branch.miami_office ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Remoto</span>
              <span className="font-semibold text-slate-900">{summary.by_branch.remote ?? 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
