import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexova Backoffice",
  description: "Panel interno para análisis de incidencias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">
        <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-8">
          <header className="mb-8 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Internal Operations
                </p>
                <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Nexova Backoffice</h1>
              </div>
              <nav className="flex items-center gap-2">
                <Link
                  href="/"
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Inicio
                </Link>
                <Link
                  href="/incidents"
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  Análisis de Incidencias
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
