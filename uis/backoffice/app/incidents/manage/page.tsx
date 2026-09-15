"use client";

import { useCallback, useEffect, useState } from "react";
import { RouteGuard } from "@/components/RouteGuard";
import { IncidentCreateForm } from "@/components/IncidentCreateForm";
import { IncidentListTable } from "@/components/IncidentListTable";
import { IncidentSummaryCards } from "@/components/IncidentSummaryCards";
import { apiFetch } from "@/lib/api-client";
import { Incident, IncidentStatus, IncidentSummary } from "@/types/incidents";

function parseApiError(payload: unknown, fallback: string): { message: string; field?: string } {
  if (!payload || typeof payload !== "object") {
    return { message: fallback };
  }

  const errorObj = (payload as { error?: unknown }).error;
  if (errorObj && typeof errorObj === "object") {
    const err = errorObj as { message?: unknown; field?: unknown };
    return {
      message: typeof err.message === "string" ? err.message : fallback,
      field: typeof err.field === "string" ? err.field : undefined,
    };
  }

  const detail = (payload as { detail?: unknown }).detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === "object" ? (item as { msg?: unknown }).msg : null))
      .filter((m): m is string => typeof m === "string");
    return { message: messages.length > 0 ? messages.join(". ") : fallback };
  }

  if (typeof detail === "string") {
    return { message: detail };
  }

  if (typeof errorObj === "string") {
    return { message: errorObj };
  }

  return { message: fallback };
}

export default function IncidentsManagerPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(true);
  const [incidentsError, setIncidentsError] = useState<string | null>(null);

  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [updatingStatusIds, setUpdatingStatusIds] = useState<Set<string>>(new Set());
  const [statusActionError, setStatusActionError] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await apiFetch("/api/incidents/summary");
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        const err = parseApiError(payload, "Error al cargar las métricas de resumen.");
        setSummaryError(err.message);
        return;
      }
      setSummary(payload);
    } catch {
      setSummaryError("No se pudo conectar con el servidor para obtener el resumen.");
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const loadIncidents = useCallback(
    async (
      selectedStatus = statusFilter,
      selectedOrigin = originFilter,
      selectedBranch = branchFilter,
      selectedCategory = categoryFilter
    ) => {
      setIncidentsLoading(true);
      setIncidentsError(null);
      try {
        const query = new URLSearchParams();
        if (selectedStatus) query.set("status", selectedStatus);
        if (selectedOrigin) query.set("origin", selectedOrigin);
        if (selectedBranch) query.set("branch", selectedBranch);
        if (selectedCategory) query.set("category", selectedCategory);

        const url = `/api/incidents${query.toString() ? `?${query.toString()}` : ""}`;
        const res = await apiFetch(url);
        const payload = await res.json().catch(() => null);

        if (!res.ok) {
          const err = parseApiError(payload, "Error al cargar la lista de incidencias.");
          setIncidentsError(err.message);
          return;
        }

        setIncidents(Array.isArray(payload) ? payload : []);
      } catch {
        setIncidentsError("No se pudo conectar con el servidor para listar incidencias.");
      } finally {
        setIncidentsLoading(false);
      }
    },
    [statusFilter, originFilter, branchFilter, categoryFilter]
  );

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadIncidents(statusFilter, originFilter, branchFilter, categoryFilter);
  }, [loadIncidents, statusFilter, originFilter, branchFilter, categoryFilter]);

  const handleRefreshAll = () => {
    loadSummary();
    loadIncidents(statusFilter, originFilter, branchFilter, categoryFilter);
  };

  const handleStatusChange = async (id: string, nextStatus: IncidentStatus) => {
    setStatusActionError(null);
    const prevIncidents = [...incidents];
    const targetIncident = prevIncidents.find((inc) => inc.id === id);
    if (!targetIncident) return;

    const previousStatus = targetIncident.status;

    // Optimistic Update
    setIncidents((current) =>
      current.map((inc) =>
        inc.id === id
          ? { ...inc, status: nextStatus, updated_at: new Date().toISOString() }
          : inc
      )
    );

    setUpdatingStatusIds((prev) => new Set(prev).add(id));

    try {
      const res = await apiFetch(`/api/incidents/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        // Rollback to previous status
        setIncidents((current) =>
          current.map((inc) => (inc.id === id ? { ...inc, status: previousStatus } : inc))
        );
        const err = parseApiError(payload, `Error al cambiar estado a ${nextStatus}`);
        setStatusActionError(`Error al actualizar incidencia #${id}: ${err.message}`);
        return;
      }

      // Server confirmed: update record from server payload
      setIncidents((current) =>
        current.map((inc) => (inc.id === id ? (payload as Incident) : inc))
      );
      // Refresh summary cards
      loadSummary();
    } catch {
      // Rollback on network exception
      setIncidents((current) =>
        current.map((inc) => (inc.id === id ? { ...inc, status: previousStatus } : inc))
      );
      setStatusActionError(`Error de red al intentar actualizar la incidencia #${id}`);
    } finally {
      setUpdatingStatusIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <RouteGuard>
      <main className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Gestor de Incidencias Centralizado
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Registro, control de ciclo de vida y métricas de soporte operacional de Nexova.
          </p>
        </div>

        {statusActionError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-sm flex items-center justify-between">
            <span>✕ {statusActionError}</span>
            <button
              type="button"
              onClick={() => setStatusActionError(null)}
              className="text-rose-600 hover:text-rose-900 font-bold ml-4"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* 1. Summary Cards Panel */}
        <IncidentSummaryCards
          summary={summary}
          loading={summaryLoading}
          error={summaryError}
          onRetry={loadSummary}
        />

        {/* 2. Create Incident Form */}
        <IncidentCreateForm
          onSuccess={handleRefreshAll}
          apiErrorMessage={parseApiError}
        />

        {/* 3. Incidents List & Transitions */}
        <IncidentListTable
          incidents={incidents}
          loading={incidentsLoading}
          error={incidentsError}
          onRetry={() => loadIncidents(statusFilter, originFilter, branchFilter, categoryFilter)}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          originFilter={originFilter}
          setOriginFilter={setOriginFilter}
          branchFilter={branchFilter}
          setBranchFilter={setBranchFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          onStatusChange={handleStatusChange}
          updatingStatusIds={updatingStatusIds}
        />
      </main>
    </RouteGuard>
  );
}
