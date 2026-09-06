"use client";

import { FormEvent, useEffect, useState } from "react";

import { RouteGuard } from "@/components/RouteGuard";
import { apiFetch } from "@/lib/api-client";

type Supplier = {
  id: string;
  name: string;
  country: "Spain" | "USA";
  categories: string[];
  monthly_rate: number;
  currency: "EUR" | "USD";
  updated_at: string;
  status: "active" | "suspended";
  contract_renewal_date: string | null;
  contact_email: string | null;
  notes: string | null;
};

type SupplierForm = Omit<Supplier, "id" | "updated_at">;

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const CATEGORIES = [
  "job_boards",
  "ats_software",
  "assessment_tools",
  "training_platforms",
  "payroll_and_hr_software",
  "video_interview",
  "background_check",
  "office_and_facilities",
  "it_and_software_licenses",
] as const;

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  job_boards: "Job boards",
  ats_software: "ATS software",
  assessment_tools: "Assessment tools",
  training_platforms: "Training platforms",
  payroll_and_hr_software: "Payroll and HR software",
  video_interview: "Video interview",
  background_check: "Background check",
  office_and_facilities: "Office and facilities",
  it_and_software_licenses: "IT and software licenses",
};

const EMPTY_FORM: SupplierForm = {
  name: "",
  country: "Spain",
  categories: [],
  monthly_rate: 0,
  currency: "EUR",
  status: "active",
  contract_renewal_date: null,
  contact_email: null,
  notes: null,
};

const INPUT_CLASS = "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";

function apiErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const detail = (payload as { detail?: unknown }).detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === "object" ? (item as { msg?: unknown }).msg : null))
      .filter((message): message is string => typeof message === "string");
    return messages.length > 0 ? messages.join(". ") : fallback;
  }

  if (typeof detail === "string") {
    return detail;
  }

  const error = (payload as { error?: unknown }).error;
  return typeof error === "string" ? error : fallback;
}

function hasUpcomingRenewal(date: string | null) {
  if (!date) {
    return false;
  }

  const renewalDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilRenewal = (renewalDate.getTime() - today.getTime()) / 86_400_000;
  return daysUntilRenewal >= 0 && daysUntilRenewal <= 60;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<SupplierForm>(EMPTY_FORM);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [rateValue, setRateValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadSuppliers = async (selectedCountry = country, selectedCategory = category) => {
    if (!API_URL) {
      setError("Falta configurar NEXT_PUBLIC_API_URL.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (selectedCountry) query.set("country", selectedCountry);
      if (selectedCategory) query.set("category", selectedCategory);
      const response = await apiFetch(`/suppliers${query.size ? `?${query}` : ""}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(apiErrorMessage(payload, "No se pudo cargar el directorio de proveedores."));
        return;
      }

      setSuppliers(payload as Supplier[]);
    } catch {
      setError("No se pudo conectar con la API de proveedores.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSuppliers();
  }, []);

  const handleCountryFilter = (value: string) => {
    setCountry(value);
    void loadSuppliers(value, category);
  };

  const handleCategoryFilter = (value: string) => {
    setCategory(value);
    void loadSuppliers(country, value);
  };

  const handleCountryChange = (value: "Spain" | "USA") => {
    setForm((current) => ({ ...current, country: value, currency: value === "Spain" ? "EUR" : "USD" }));
  };

  const toggleCategory = (selectedCategory: string) => {
    setForm((current) => ({
      ...current,
      categories: current.categories.includes(selectedCategory)
        ? current.categories.filter((categoryName) => categoryName !== selectedCategory)
        : [...current.categories, selectedCategory],
    }));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!API_URL) {
      setError("Falta configurar NEXT_PUBLIC_API_URL.");
      return;
    }
    if (form.categories.length === 0) {
      setError("Selecciona al menos una categoría.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch("/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(apiErrorMessage(payload, "No se pudo crear el proveedor."));
        return;
      }

      setForm(EMPTY_FORM);
      setIsFormOpen(false);
      await loadSuppliers();
    } catch {
      setError("No se pudo conectar con la API de proveedores.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveRate = async (supplierId: string) => {
    if (!API_URL) {
      setError("Falta configurar NEXT_PUBLIC_API_URL.");
      return;
    }

    setError(null);
    try {
      const response = await apiFetch(`/suppliers/${supplierId}/rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthly_rate: Number(rateValue) }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(apiErrorMessage(payload, "No se pudo actualizar la tarifa."));
        return;
      }

      setSuppliers((current) => current.map((supplier) => (supplier.id === supplierId ? (payload as Supplier) : supplier)));
      setEditingRateId(null);
      setRateValue("");
    } catch {
      setError("No se pudo conectar con la API de proveedores.");
    }
  };

  const changeStatus = async (supplier: Supplier) => {
    if (!API_URL) {
      setError("Falta configurar NEXT_PUBLIC_API_URL.");
      return;
    }

    setError(null);
    const status = supplier.status === "active" ? "suspended" : "active";
    try {
      const response = await apiFetch(`/suppliers/${supplier.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(apiErrorMessage(payload, "No se pudo actualizar el estado."));
        return;
      }

      setSuppliers((current) => current.map((item) => (item.id === supplier.id ? (payload as Supplier) : item)));
    } catch {
      setError("No se pudo conectar con la API de proveedores.");
    }
  };

  return (
    <RouteGuard>
    <main className="space-y-6 pb-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">Directorio de proveedores</h2>
            <p className="mt-2 text-sm text-slate-600">Gestiona proveedores, tarifas y renovaciones de contrato.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen((open) => !open)}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            {isFormOpen ? "Cerrar formulario" : "Nuevo proveedor"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">
            País
            <select value={country} onChange={(event) => handleCountryFilter(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
              <option value="">Todos</option>
              <option value="Spain">Spain</option>
              <option value="USA">USA</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-700">
            Categoría
            <select value={category} onChange={(event) => handleCategoryFilter(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900">
              <option value="">Todas</option>
              {CATEGORIES.map((categoryName) => <option key={categoryName} value={categoryName}>{CATEGORY_LABELS[categoryName]}</option>)}
            </select>
          </label>
        </div>

        {error ? <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div> : null}

        {isFormOpen ? (
          <form onSubmit={handleCreate} className="mt-6 border-t border-slate-200 pt-6">
            <h3 className="text-base font-semibold text-slate-900">Registrar proveedor</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Nombre"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={INPUT_CLASS} /></Field>
              <Field label="País"><select value={form.country} onChange={(event) => handleCountryChange(event.target.value as "Spain" | "USA")} className={INPUT_CLASS}><option value="Spain">Spain</option><option value="USA">USA</option></select></Field>
              <Field label="Tarifa mensual"><input required min="0.01" step="0.01" type="number" value={form.monthly_rate || ""} onChange={(event) => setForm({ ...form, monthly_rate: Number(event.target.value) })} className={INPUT_CLASS} /></Field>
              <Field label="Moneda"><input value={form.currency} readOnly className={`${INPUT_CLASS} bg-slate-100`} /></Field>
              <Field label="Estado"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Supplier["status"] })} className={INPUT_CLASS}><option value="active">Activo</option><option value="suspended">Suspendido</option></select></Field>
              <Field label="Renovación de contrato"><input type="date" value={form.contract_renewal_date ?? ""} onChange={(event) => setForm({ ...form, contract_renewal_date: event.target.value || null })} className={INPUT_CLASS} /></Field>
              <Field label="Email de contacto"><input type="email" value={form.contact_email ?? ""} onChange={(event) => setForm({ ...form, contact_email: event.target.value || null })} className={INPUT_CLASS} /></Field>
              <Field label="Notas"><textarea value={form.notes ?? ""} onChange={(event) => setForm({ ...form, notes: event.target.value || null })} className={`${INPUT_CLASS} min-h-20`} /></Field>
            </div>
            <fieldset className="mt-4"><legend className="text-sm font-medium text-slate-700">Categorías</legend><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{CATEGORIES.map((categoryName) => <label key={categoryName} className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.categories.includes(categoryName)} onChange={() => toggleCategory(categoryName)} className="h-4 w-4 rounded border-slate-300" />{CATEGORY_LABELS[categoryName]}</label>)}</div></fieldset>
            <button type="submit" disabled={isSubmitting} className="mt-5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400">{isSubmitting ? "Guardando..." : "Crear proveedor"}</button>
          </form>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-slate-600"><tr><th className="px-4 py-3 font-medium">Nombre</th><th className="px-4 py-3 font-medium">País</th><th className="px-4 py-3 font-medium">Categorías</th><th className="px-4 py-3 font-medium">Tarifa mensual</th><th className="px-4 py-3 font-medium">Estado</th><th className="px-4 py-3 font-medium">Renovación</th><th className="px-4 py-3 font-medium">Acciones</th></tr></thead>
            <tbody>
              {isLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">Cargando proveedores...</td></tr> : null}
              {!isLoading && suppliers.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-600">No hay proveedores para los filtros seleccionados.</td></tr> : null}
              {suppliers.map((supplier) => <tr key={supplier.id} className="border-t border-slate-200 text-slate-800"><td className="px-4 py-3 font-medium">{supplier.name}</td><td className="px-4 py-3">{supplier.country}</td><td className="px-4 py-3"><div className="flex min-w-48 flex-wrap gap-1">{supplier.categories.map((categoryName) => <span key={categoryName} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">{CATEGORY_LABELS[categoryName as keyof typeof CATEGORY_LABELS] ?? categoryName}</span>)}</div></td><td className="px-4 py-3">{editingRateId === supplier.id ? <div className="flex items-center gap-2"><input aria-label={`Nueva tarifa para ${supplier.name}`} type="number" min="0.01" step="0.01" value={rateValue} onChange={(event) => setRateValue(event.target.value)} className="w-24 rounded-md border border-slate-300 px-2 py-1" /><button type="button" onClick={() => void saveRate(supplier.id)} className="font-medium text-slate-900 hover:underline">Guardar</button><button type="button" onClick={() => setEditingRateId(null)} className="text-slate-600 hover:underline">Cancelar</button></div> : <div className="flex items-center gap-2"><span>{supplier.currency === "EUR" ? "€" : "$"}{supplier.monthly_rate.toFixed(2)}</span><button type="button" onClick={() => { setEditingRateId(supplier.id); setRateValue(String(supplier.monthly_rate)); }} className="font-medium text-slate-700 hover:text-slate-950 hover:underline">Editar</button></div>}</td><td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${supplier.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>{supplier.status === "active" ? "Activo" : "Suspendido"}</span></td><td className="px-4 py-3">{supplier.contract_renewal_date ? <div className="space-y-1"><p>{supplier.contract_renewal_date}</p>{hasUpcomingRenewal(supplier.contract_renewal_date) ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">Renovación próxima</span> : null}</div> : <span className="text-slate-500">Sin fecha</span>}</td><td className="px-4 py-3"><button type="button" onClick={() => void changeStatus(supplier)} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">{supplier.status === "active" ? "Suspender" : "Activar"}</button></td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </main>
    </RouteGuard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-sm font-medium text-slate-700">{label}<span className="mt-1 block">{children}</span></label>;
}