"use client";

import {
  BRANCH_LABELS,
  CATEGORY_LABELS,
  Incident,
  IncidentBranch,
  IncidentCategory,
  IncidentOrigin,
  IncidentStatus,
  ORIGIN_LABELS,
  STATUS_LABELS,
} from "@/types/incidents";

interface IncidentListTableProps {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  originFilter: string;
  setOriginFilter: (val: string) => void;
  branchFilter: string;
  setBranchFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  onStatusChange: (id: string, newStatus: IncidentStatus) => Promise<void>;
  updatingStatusIds: Set<string>;
}

export function IncidentListTable({
  incidents,
  loading,
  error,
  onRetry,
  statusFilter,
  setStatusFilter,
  originFilter,
  setOriginFilter,
  branchFilter,
  setBranchFilter,
  categoryFilter,
  setCategoryFilter,
  onStatusChange,
  updatingStatusIds,
}: IncidentListTableProps) {
  const getNextTransitions = (status: IncidentStatus): IncidentStatus[] => {
    switch (status) {
      case "open":
        return ["in_progress", "discarded"];
      case "in_progress":
        return ["resolved", "discarded"];
      case "resolved":
      case "discarded":
      default:
        return [];
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case "open":
        return (
          <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
            Abierta
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
            En progreso
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            Resuelta
          </span>
        );
      case "discarded":
        return (
          <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10">
            Descartada
          </span>
        );
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Listado de Incidencias</h2>
          <p className="text-xs text-slate-500">Consulta y gestiona las incidencias registradas</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 border-y border-slate-100 py-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600">Filtrar por Estado</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">Todos los estados</option>
            <option value="open">Abierta</option>
            <option value="in_progress">En progreso</option>
            <option value="resolved">Resuelta</option>
            <option value="discarded">Descartada</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600">Filtrar por Origen</label>
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">Todos los orígenes</option>
            <option value="customer">Cliente</option>
            <option value="branch">Sucursal</option>
            <option value="internal">Interno</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600">Filtrar por Sucursal</label>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">Todas las sucursales</option>
            <option value="central">Central — Sede Valencia</option>
            <option value="valencia_operations">Valencia — Operaciones</option>
            <option value="miami_office">Miami Office</option>
            <option value="remote">Remoto</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600">Filtrar por Categoría</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
          >
            <option value="">Todas las categorías</option>
            <option value="technical_failure">Fallo técnico</option>
            <option value="process_error">Error de proceso</option>
            <option value="client_complaint">Reclamación cliente</option>
            <option value="candidate_issue">Incidencia candidato</option>
            <option value="staff_issue">Incidencia personal</option>
            <option value="sla_breach">Incumplimiento SLA</option>
            <option value="data_quality">Calidad datos</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>

      {/* Content states */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <p className="mt-2 text-xs text-slate-500">Cargando incidencias...</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-6 text-center">
          <p className="text-sm font-semibold text-rose-900">Error al obtener las incidencias</p>
          <p className="mt-1 text-xs text-rose-700">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex items-center rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-800"
          >
            Reintentar listado
          </button>
        </div>
      ) : incidents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm font-semibold text-slate-800">No hay incidencias que coincidan con los filtros</p>
          <p className="mt-1 text-xs text-slate-500">
            Prueba a limpiar o cambiar los criterios de búsqueda, o registra una nueva incidencia.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold">Título y Descripción</th>
                <th className="pb-3 font-semibold">Categoría</th>
                <th className="pb-3 font-semibold">Origen / Sucursal</th>
                <th className="pb-3 font-semibold">Fecha</th>
                <th className="pb-3 font-semibold">Estado</th>
                <th className="pb-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidents.map((incident) => {
                const transitions = getNextTransitions(incident.status);
                const isUpdating = updatingStatusIds.has(incident.id);

                return (
                  <tr key={incident.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 pr-4 max-w-xs sm:max-w-md">
                      <p className="font-semibold text-slate-900">{incident.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-slate-500 text-[11px]">{incident.description}</p>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-slate-700">
                      {CATEGORY_LABELS[incident.category] || incident.category}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      <p className="text-slate-800 font-medium">{ORIGIN_LABELS[incident.origin] || incident.origin}</p>
                      <p className="text-[11px] text-slate-500">{BRANCH_LABELS[incident.branch] || incident.branch}</p>
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap text-slate-500">
                      {formatDate(incident.created_at)}
                    </td>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {getStatusBadge(incident.status)}
                    </td>
                    <td className="py-3 text-right whitespace-nowrap">
                      {isUpdating ? (
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
                      ) : transitions.length > 0 ? (
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {transitions.map((nextStatus) => {
                            const isDiscard = nextStatus === "discarded";
                            const isResolve = nextStatus === "resolved";
                            const isProgress = nextStatus === "in_progress";

                            let btnStyle = "border-slate-300 text-slate-700 hover:bg-slate-100";
                            if (isResolve) btnStyle = "border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/40";
                            if (isProgress) btnStyle = "border-blue-300 text-blue-700 hover:bg-blue-50 bg-blue-50/40";
                            if (isDiscard) btnStyle = "border-rose-200 text-rose-700 hover:bg-rose-50";

                            return (
                              <button
                                key={nextStatus}
                                type="button"
                                onClick={() => onStatusChange(incident.id, nextStatus)}
                                className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition ${btnStyle}`}
                              >
                                Pasar a {STATUS_LABELS[nextStatus]}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[11px] italic text-slate-400">Sin acciones</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
