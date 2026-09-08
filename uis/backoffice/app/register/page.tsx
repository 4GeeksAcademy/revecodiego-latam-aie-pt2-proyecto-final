"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api-client";
import { saveToken } from "@/lib/auth";

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

export default function RegisterPage() {
  const router = useRouter();
  const { refreshAuthState } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const registrationData = {
      email,
      password,
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
      ...(address ? { address } : {}),
    };

    try {
      const registerResponse = await apiFetch("/users/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registrationData),
      });
      const registerPayload = await registerResponse.json().catch(() => null);
      if (!registerResponse.ok) {
        setError(getErrorMessage(registerPayload, "No fue posible crear la cuenta."));
        return;
      }

      const loginResponse = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginPayload = await loginResponse.json().catch(() => null);
      if (!loginResponse.ok || !loginPayload?.access_token) {
        router.push("/login?message=Cuenta%20creada%2C%20por%20favor%20inicia%20sesión");
        return;
      }

      saveToken(loginPayload.access_token);
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
      <h1 className="text-2xl font-semibold text-slate-900">Crear cuenta</h1>
      <p className="mt-2 text-sm text-slate-600">Registra tu acceso al panel interno de Nexova.</p>
      {error ? <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-slate-700">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
        <label className="block text-sm font-medium text-slate-700">Contraseña<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
        <label className="block text-sm font-medium text-slate-700">Nombre (opcional)<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
        <label className="block text-sm font-medium text-slate-700">Teléfono (opcional)<input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
        <label className="block text-sm font-medium text-slate-700">Dirección (opcional)<textarea value={address} onChange={(event) => setAddress(event.target.value)} className="mt-1 block min-h-20 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900" /></label>
        <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">{isSubmitting ? "Creando cuenta..." : "Crear cuenta"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">¿Ya tienes cuenta? <Link href="/login" className="font-medium text-slate-900 underline">Inicia sesión</Link></p>
    </main>
  );
}