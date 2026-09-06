"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { saveToken } from "@/lib/auth";

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && typeof (payload as { detail?: unknown }).detail === "string") {
    return (payload as { detail: string }).detail;
  }
  return fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuthState } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.access_token) {
        setError(getErrorMessage(payload, "No fue posible iniciar sesión."));
        return;
      }

      saveToken(payload.access_token);
      refreshAuthState();
      router.push("/");
    } catch {
      setError("No se pudo conectar con el servicio de autenticación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-slate-600">Accede al panel interno de Nexova.</p>
      {searchParams.get("message") ? <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{searchParams.get("message")}</p> : null}
      {error ? <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
        <label className="block text-sm font-medium text-slate-700">Contraseña<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
        <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">{isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">¿No tienes cuenta? <Link href="/register" className="font-medium text-slate-900 underline">Regístrate</Link></p>
    </main>
  );
}