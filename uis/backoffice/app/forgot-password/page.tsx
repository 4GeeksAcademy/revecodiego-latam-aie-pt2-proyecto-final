"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { apiFetch } from "@/lib/api-client";

const GENERIC_MESSAGE = "Si esa dirección está registrada, recibirás un enlace en breve.";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || message) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // El mensaje es siempre el mismo para no revelar si el email está registrado.
      setMessage(GENERIC_MESSAGE);
    } catch {
      setError("No se pudo conectar con el servicio de autenticación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Recuperar contraseña</h1>
      <p className="mt-2 text-sm text-slate-600">Te enviaremos un enlace para restablecer tu contraseña de Nexova.</p>
      {message ? <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}
      {error ? <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Email<input required type="email" value={email} disabled={isSubmitting || Boolean(message)} onChange={(event) => setEmail(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100" /></label>
        <button type="submit" disabled={isSubmitting || Boolean(message)} className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">{isSubmitting ? "Enviando enlace..." : "Enviar enlace"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">¿Recordaste tu contraseña? <Link href="/login" className="font-medium text-slate-900 underline">Inicia sesión</Link></p>
    </main>
  );
}
