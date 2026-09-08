"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { apiFetch } from "@/lib/api-client";

function getErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail.flatMap((item) => typeof item?.msg === "string" ? [item.msg] : []);
    if (messages.length) return messages.join(". ");
  }
  return fallback;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(getErrorMessage(payload, "No fue posible restablecer la contraseña."));
        return;
      }

      setSuccess("Contraseña actualizada correctamente. Te llevamos al inicio de sesión...");
      setTimeout(() => router.push("/login?message=Contraseña%20actualizada%2C%20inicia%20sesión"), 1500);
    } catch {
      setError("No se pudo conectar con el servicio de autenticación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <main className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Enlace no válido</h1>
        <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">El enlace de restablecimiento es inválido o ha expirado.</p>
        <p className="mt-6 text-center text-sm text-slate-600">Solicita uno nuevo desde <Link href="/forgot-password" className="font-medium text-slate-900 underline">recuperar contraseña</Link>.</p>
      </main>
    );
  }

  return (
    <main className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Restablecer contraseña</h1>
      <p className="mt-2 text-sm text-slate-600">Define una nueva contraseña para tu cuenta de Nexova.</p>
      {success ? <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p> : null}
      {error ? <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      {!success ? (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">Nueva contraseña<input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
          <label className="block text-sm font-medium text-slate-700">Confirmar nueva contraseña<input required minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
          <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">{isSubmitting ? "Guardando..." : "Guardar contraseña"}</button>
        </form>
      ) : null}
      {error ? <p className="mt-6 text-center text-sm text-slate-600">¿El enlace ya no sirve? <Link href="/forgot-password" className="font-medium text-slate-900 underline">Solicita uno nuevo</Link></p> : null}
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><p className="text-sm text-slate-600">Cargando...</p></main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
