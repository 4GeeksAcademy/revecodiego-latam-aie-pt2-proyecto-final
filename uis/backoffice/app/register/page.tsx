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
    const messages = detail.flatMap((item) => {
      if (typeof item?.msg !== "string") return [];
      const msg = item.msg;
      const loc = Array.isArray(item?.loc) ? item.loc.slice(1).join(".") : "";
      const lower = msg.toLowerCase();
      if (lower.includes("field required")) return [`El campo "${loc}" es obligatorio`];
      if (lower.includes("extra inputs")) return [`Campo no esperado: "${loc}"`];
      if (lower.includes("not a valid email")) return ["El email ingresado no es válido"];
      if (lower.includes("at least") || lower.includes("longer than")) return ["La contraseña debe tener al menos 8 caracteres"];
      if (lower.includes("email already exists")) return ["Este email ya está registrado"];
      return [msg];
    });
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
  const [showLoginCTA, setShowLoginCTA] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setShowLoginCTA(false);
    setIsSubmitting(true);

    let registered = false;
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
        setError(getErrorMessage(registerPayload, "No fue posible crear la cuenta. Verifica los datos e inténtalo de nuevo."));
        return;
      }

      registered = true;

      const loginResponse = await apiFetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const loginPayload = await loginResponse.json().catch(() => null);
      if (!loginResponse.ok || !loginPayload?.access_token) {
        setError("Tu cuenta se creó correctamente, pero no pudimos iniciar sesión automáticamente.");
        setShowLoginCTA(true);
        return;
      }

      saveToken(loginPayload.access_token);
      refreshAuthState();
      router.push("/");
    } catch {
      if (registered) {
        setError("Tu cuenta se creó correctamente, pero no pudimos iniciar sesión automáticamente. Por favor inicia sesión manualmente.");
        setShowLoginCTA(true);
      } else {
        setError("No se pudo conectar con el servicio de autenticación. Revisa tu conexión e inténtalo de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">Crear cuenta</h1>
      <p className="mt-2 text-sm text-slate-600">Registra tu acceso al panel interno de Nexova.</p>
      {error ? (
        <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-800">
          <p>{error}</p>
          {showLoginCTA ? (
            <Link
              href="/login"
              className="mt-2 inline-block font-semibold underline transition hover:text-rose-900"
            >
              Ir a iniciar sesión
            </Link>
          ) : null}
        </div>
      ) : null}
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