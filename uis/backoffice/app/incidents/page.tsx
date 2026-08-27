"use client";

import { ChangeEvent, DragEvent, useMemo, useState } from "react";

type Summary = {
  totals: {
    total_records: number;
    valid_records: number;
    invalid_records: number;
  };
  categories: {
    order: string[];
    counts: Record<string, number>;
    percentages: Record<string, number>;
  };
  statuses: {
    order: string[];
    counts: Record<string, number>;
    percentages: Record<string, number>;
  };
  invalid_reasons: {
    counts: Record<string, number>;
    order: string[];
  };
  satisfaction: {
    closed_total: number;
    scored_tickets: number;
    average_score: number;
    score_counts: Record<string, number>;
  };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const INVALID_REASON_LABELS: Record<string, string> = {
  missing_client_company: "Falta client_company",
  invalid_category: "Categoría inválida o vacía",
  invalid_description: "Descripción inválida o muy corta",
  invalid_agent_id: "agent_id inválido o vacío",
  invalid_email: "Email inválido o vacío",
  closed_no_score: "Ticket CLOSED sin score",
  score_out_of_range: "satisfaction_score fuera de rango (1-5)",
};

export default function IncidentsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  const invalidEntries = useMemo(() => {
    if (!summary) {
      return [] as Array<[string, number]>;
    }

    return summary.invalid_reasons.order
      .map((reason) => [reason, summary.invalid_reasons.counts[reason] ?? 0] as [string, number])
      .filter(([, count]) => count > 0);
  }, [summary]);

  const onFilePicked = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Solo se permiten archivos .csv");
      setSelectedFile(null);
      setSummary(null);
      return;
    }

    setError(null);
    setSelectedFile(file);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFilePicked(event.target.files?.[0] ?? null);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    onFilePicked(event.dataTransfer.files?.[0] ?? null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Selecciona un archivo CSV antes de analizar.");
      return;
    }

    if (!API_URL) {
      setError("Falta configurar NEXT_PUBLIC_API_URL.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(`${API_URL}/api/incidents/analyze`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();
      if (!response.ok) {
        setSummary(null);
        setError(payload?.error ?? "No fue posible analizar el archivo.");
        return;
      }

      setSummary(payload as Summary);
    } catch {
      setSummary(null);
      setError("No se pudo conectar con la API de análisis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownload = async () => {
    if (!API_URL) {
      setError("Falta configurar NEXT_PUBLIC_API_URL.");
      return;
    }

    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/incidents/results/export`);
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "No se pudo descargar el CSV.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "results.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo descargar el CSV.");
    }
  };

  return (
    <main className="space-y-6 pb-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">Análisis de Incidencias</h2>
        <p className="mt-2 text-sm text-slate-600">
          Carga un archivo CSV para analizar calidad de datos y métricas agregadas de soporte.
        </p>

        <div
          className={`mt-6 rounded-xl border-2 border-dashed p-6 transition ${
            isDragging ? "border-slate-900 bg-slate-50" : "border-slate-300 bg-slate-50/60"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p className="text-sm font-medium text-slate-700">
            Arrastra aquí tu archivo CSV o selecciónalo manualmente.
          </p>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleInputChange}
            className="mt-4 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
          />
          {selectedFile ? (
            <p className="mt-3 text-sm text-slate-600">
              Archivo seleccionado: <span className="font-medium text-slate-900">{selectedFile.name}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isAnalyzing ? "Analizando..." : "Analizar"}
          </button>

          {summary ? (
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Descargar CSV
            </button>
          ) : null}
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
        ) : null}
      </section>

      {summary ? (
        <section className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard title="Total de registros" value={summary.totals.total_records} />
            <MetricCard title="Registros válidos" value={summary.totals.valid_records} />
            <MetricCard title="Registros inválidos" value={summary.totals.invalid_records} />
          </div>

          {invalidEntries.length > 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-base font-semibold text-amber-900">Registros inválidos detectados</h3>
              <ul className="mt-3 space-y-2 text-sm text-amber-900">
                {invalidEntries.map(([reason, count]) => (
                  <li key={reason}>
                    {INVALID_REASON_LABELS[reason] ?? reason}: <span className="font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <DataTable
              title="Desglose por categoría"
              rows={summary.categories.order.map((category) => ({
                label: category,
                count: summary.categories.counts[category] ?? 0,
                percentage: summary.categories.percentages[category] ?? 0,
              }))}
            />
            <DataTable
              title="Desglose por estado"
              rows={summary.statuses.order.map((status) => ({
                label: status,
                count: summary.statuses.counts[status] ?? 0,
                percentage: summary.statuses.percentages[status] ?? 0,
              }))}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Índice de satisfacción</h3>
            <p className="mt-2 text-sm text-slate-600">
              Tickets calificados: {summary.satisfaction.scored_tickets} de {summary.satisfaction.closed_total}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Promedio: <span className="font-semibold">{summary.satisfaction.average_score.toFixed(2)} / 5.00</span>
            </p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map((score) => (
                <div key={score} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                  <p className="font-medium text-slate-700">Score {score}</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {summary.satisfaction.score_counts[String(score)] ?? 0}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}

type MetricCardProps = {
  title: string;
  value: number;
};

function MetricCard({ title, value }: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-600">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </article>
  );
}

type DataRow = {
  label: string;
  count: number;
  percentage: number;
};

type DataTableProps = {
  title: string;
  rows: DataRow[];
};

function DataTable({ title, rows }: DataTableProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-3 py-2 font-medium">Tipo</th>
              <th className="px-3 py-2 font-medium">Cantidad</th>
              <th className="px-3 py-2 font-medium">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-slate-200 bg-white text-slate-800">
                <td className="px-3 py-2 font-medium">{row.label}</td>
                <td className="px-3 py-2">{row.count}</td>
                <td className="px-3 py-2">{row.percentage.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
