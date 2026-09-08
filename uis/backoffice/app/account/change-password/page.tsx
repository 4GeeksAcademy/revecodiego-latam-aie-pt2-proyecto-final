"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { RouteGuard } from "@/components/RouteGuard";
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

function ChangePasswordContent() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiFetch("/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(getErrorMessage(payload, "No se pudo actualizar la contraseña."));
        return;
      }

      setSuccess("Contraseña actualizada correctamente. Tu sesión sigue activa.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("No se pudo conectar con el servicio de autenticación.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl pb-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">Cambiar contraseña</h2>
        <p className="mt-2 text-sm text-slate-600">Actualiza la contraseña de acceso a tu cuenta de Nexova.</p>
        {error ? <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
        {success ? <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p> : null}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">Contraseña actual<input required type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
          <label className="block text-sm font-medium text-slate-700">Nueva contraseña<input required minLength={8} type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
          <label className="block text-sm font-medium text-slate-700">Confirmar nueva contraseña<input required minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
          <button type="submit" disabled={isSaving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">{isSaving ? "Guardando..." : "Cambiar contraseña"}</button>
        </form>
        <p className="mt-6 border-t border-slate-200 pt-6 text-sm text-slate-600">¿Prefieres actualizar tus datos? <Link href="/account/profile" className="font-medium text-slate-900 underline">Ir a mi perfil</Link></p>
      </section>
    </main>
  );
}

export default function ChangePasswordPage() {
  return <RouteGuard><ChangePasswordContent /></RouteGuard>;
}
