"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { RouteGuard } from "@/components/RouteGuard";
import { apiFetch } from "@/lib/api-client";

type Profile = {
  id: string;
  user_id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
};

type MeResponse = {
  email: string;
  role: string;
  profile: Profile | null;
};

function getErrorMessage(payload: unknown, fallback: string) {
  if (payload && typeof payload === "object" && typeof (payload as { detail?: unknown }).detail === "string") {
    return (payload as { detail: string }).detail;
  }
  return fallback;
}

function ProfilePageContent() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const applyProfile = (data: MeResponse) => {
    setEmail(data.email);
    setRole(data.role);
    setName(data.profile?.name ?? "");
    setPhone(data.profile?.phone ?? "");
    setAddress(data.profile?.address ?? "");
  };

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/auth/me");
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(getErrorMessage(payload, "No se pudo cargar el perfil."));
        return;
      }
      applyProfile(payload as MeResponse);
    } catch {
      setError("No se pudo conectar con el servicio de autenticación.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadProfile();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const response = await apiFetch("/profiles/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(getErrorMessage(payload, "No se pudo actualizar el perfil."));
        return;
      }

      setSuccess("Perfil actualizado");
      await loadProfile();
    } catch {
      setError("No se pudo conectar con el servicio de autenticación.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <main className="flex min-h-48 items-center justify-center text-sm text-slate-600">Cargando perfil...</main>;
  }

  return (
    <main className="mx-auto max-w-2xl pb-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">Mi perfil</h2>
        <p className="mt-2 text-sm text-slate-600">Actualiza los datos de contacto asociados a tu cuenta.</p>
        {error ? <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
        {success ? <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p> : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Email<input value={email} readOnly className="mt-1 block w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-sm text-slate-700" /></label>
          <div className="text-sm font-medium text-slate-700">Rol<span className="mt-1 inline-block rounded-full bg-slate-100 px-3 py-2 text-sm font-medium capitalize text-slate-700">{role}</span></div>
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-slate-200 pt-6">
          <label className="block text-sm font-medium text-slate-700">Nombre<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
          <label className="block text-sm font-medium text-slate-700">Teléfono<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
          <label className="block text-sm font-medium text-slate-700">Dirección<textarea value={address} onChange={(event) => setAddress(event.target.value)} className="mt-1 block min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
          <button type="submit" disabled={isSaving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">{isSaving ? "Guardando..." : "Guardar cambios"}</button>
        </form>
        <p className="mt-6 border-t border-slate-200 pt-6 text-sm text-slate-600">¿Quieres cambiar tu contraseña? <Link href="/account/change-password" className="font-medium text-slate-900 underline">Cambiar contraseña</Link></p>
      </section>
    </main>
  );
}

export default function ProfilePage() {
  return <RouteGuard><ProfilePageContent /></RouteGuard>;
}