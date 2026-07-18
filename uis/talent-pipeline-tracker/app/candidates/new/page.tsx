import Link from "next/link";

import CandidateForm from "../../../components/CandidateForm";

export default function NewCandidatePage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white md:text-3xl">
            Nueva candidatura
          </h1>
          <p className="text-sm text-gray-300">
            Registra una candidatura nueva para el proceso activo.
          </p>
        </div>

        <Link
          href="/"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-200 hover:bg-white/10"
        >
          Volver al listado
        </Link>
      </div>

      <CandidateForm mode="create" />
    </main>
  );
}
