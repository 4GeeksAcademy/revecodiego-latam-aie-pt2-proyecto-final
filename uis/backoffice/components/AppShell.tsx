"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { isLoggedIn, loading, logout } = useAuth();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <div className="flex min-h-screen items-center justify-center px-4 py-8">{children}</div>;
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-8">
      <header className="mb-8 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Internal Operations</p>
            <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">Nexova Backoffice</h1>
          </div>
          {!loading ? (
            <nav className="flex flex-wrap items-center gap-2">
              {isLoggedIn ? <><Link href="/" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Inicio</Link><Link href="/incidents" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700">Análisis de Incidencias</Link><Link href="/suppliers" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Proveedores</Link><Link href="/account/profile" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Mi perfil</Link><button type="button" onClick={logout} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cerrar sesión</button></> : <><Link href="/login" className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700">Iniciar sesión</Link><Link href="/register" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Registrarse</Link></>}
            </nav>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  );
}