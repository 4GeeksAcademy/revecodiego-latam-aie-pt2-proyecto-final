import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Panel de Operaciones</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Este backoffice permite analizar lotes de incidencias en CSV y obtener métricas agregadas para seguimiento de calidad de servicio.
        </p>
        <div className="mt-6">
          <Link
            href="/incidents"
            className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Ir al análisis de incidencias
          </Link>
        </div>
      </section>
    </main>
  );
}
