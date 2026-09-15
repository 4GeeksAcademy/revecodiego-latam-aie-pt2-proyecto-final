"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { saveToken } from "@/lib/auth";

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail.flatMap((item) => {
      if (typeof item?.msg !== "string") return [];
      const msg = item.msg;
      const lower = msg.toLowerCase();
      if (lower.includes("field required")) return ["Faltan campos obligatorios."];
      if (lower.includes("not a valid email")) return ["El email ingresado no es válido"];
      if (lower.includes("at least") || lower.includes("longer than")) return ["La contraseña debe tener al menos 8 caracteres"];
      return [msg];
    });
    if (messages.length) return messages.join(". ");
  }
  return fallback;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshAuthState } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setRetryAction(null);
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
      setError("No se pudo conectar con el servicio. Revisa tu conexión e inténtalo de nuevo.");
      setRetryAction(() => () => { setRetryAction(null); void handleSubmit({ preventDefault() {} } as FormEvent<HTMLFormElement>); });
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
      {error && retryAction ? <button type="button" onClick={retryAction} className="mt-2 rounded-lg bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-800 transition hover:bg-rose-200">Reintentar</button> : null}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Email<input required type="email" value={email} disabled={isSubmitting} onChange={(event) => setEmail(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100" /></label>
        <label className="block text-sm font-medium text-slate-700">Contraseña<input required type="password" value={password} disabled={isSubmitting} onChange={(event) => setPassword(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100" /></label>
        <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">{isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">¿Olvidaste tu contraseña? <Link href="/forgot-password" className="font-medium text-slate-900 underline">Recupérala</Link></p>
      <p className="mt-2 text-center text-sm text-slate-600">¿No tienes cuenta? <Link href="/register" className="font-medium text-slate-900 underline">Regístrate</Link></p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-sm text-slate-600">Cargando...</p></main>}>
      <LoginForm />
    </Suspense>
  );
}