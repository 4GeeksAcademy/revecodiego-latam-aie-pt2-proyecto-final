import Link from "next/link";
import CandidateList from "../components/CandidateList";
import FiltersBar from "../components/FiltersBar";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 md:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">
            Asistente de Direccion · Sede Valencia
          </h1>
          <p className="text-sm text-gray-300">
            Seguimiento de candidaturas del proceso activo en Nexova.
          </p>
        </div>

        <Link
          href="/candidates/new"
          className="rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100"
        >
          Nueva candidatura
        </Link>
      </header>

      <FiltersBar />
      <CandidateList />
    </main>
  );
}
