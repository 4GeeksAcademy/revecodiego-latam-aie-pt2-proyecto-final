"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ApiError, createRecord, replaceRecord } from "../lib/api";
import type {
  Record as TalentRecord,
  RecordCreateInput,
} from "../types/record";

type CandidateFormMode = "create" | "edit";

type FormErrors = Partial<Record<keyof RecordCreateInput, string>>;

interface CandidateFormProps {
  mode: CandidateFormMode;
  initialData?: TalentRecord;
  redirectOnSuccess?: boolean;
  onSuccess?: (record: TalentRecord) => void;
}

interface CandidateFormState {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  experience_years: string;
  linkedin_url: string;
  cv_url: string;
}

function getInitialState(initialData?: TalentRecord): CandidateFormState {
  return {
    full_name: initialData?.full_name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    position: initialData?.position ?? "",
    experience_years:
      typeof initialData?.experience_years === "number"
        ? String(initialData.experience_years)
        : "",
    linkedin_url: initialData?.linkedin_url ?? "",
    cv_url: initialData?.cv_url ?? "",
  };
}

function validate(values: CandidateFormState): FormErrors {
  const errors: FormErrors = {};

  if (!values.full_name.trim()) {
    errors.full_name = "El nombre completo es obligatorio.";
  }
  if (!values.email.trim()) {
    errors.email = "El email es obligatorio.";
  }
  if (!values.phone.trim()) {
    errors.phone = "El telefono es obligatorio.";
  }
  if (!values.position.trim()) {
    errors.position = "El puesto es obligatorio.";
  }
  if (!values.experience_years.trim()) {
    errors.experience_years = "Los anos de experiencia son obligatorios.";
  } else {
    const years = Number(values.experience_years);
    if (Number.isNaN(years) || years < 0) {
      errors.experience_years = "Indica un numero valido mayor o igual a 0.";
    }
  }

  return errors;
}

export default function CandidateForm({
  mode,
  initialData,
  redirectOnSuccess = mode === "create",
  onSuccess,
}: CandidateFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<CandidateFormState>(
    getInitialState(initialData),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const showSuccess = (message: string) => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }

    setSuccessMessage(message);
    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage(null);
    }, 2200);
  };

  const submitLabel = useMemo(
    () => (mode === "create" ? "Crear candidatura" : "Guardar cambios"),
    [mode],
  );

  const handleChange = (
    key: keyof CandidateFormState,
    value: string,
  ): void => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (mode === "edit" && !initialData?.id) {
      setErrorMessage("No se encontro el ID de la candidatura para editar.");
      return;
    }

    const payload: RecordCreateInput = {
      full_name: values.full_name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      position: values.position.trim(),
      experience_years: Number(values.experience_years),
      linkedin_url: values.linkedin_url.trim() || null,
      cv_url: values.cv_url.trim() || null,
    };

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const savedRecord =
        mode === "create"
          ? await createRecord(payload)
          : await replaceRecord(initialData.id, payload);

      showSuccess(
        mode === "create"
          ? "Candidatura creada correctamente."
          : "Guardado.",
      );

      onSuccess?.(savedRecord);

      if (redirectOnSuccess) {
        router.push(`/candidates/${savedRecord.id}`);
      }
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo guardar la candidatura.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Nombre completo *
          <input
            type="text"
            value={values.full_name}
            onChange={(event) => handleChange("full_name", event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
          {errors.full_name ? <span className="text-xs text-red-700">{errors.full_name}</span> : null}
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Email *
          <input
            type="email"
            value={values.email}
            onChange={(event) => handleChange("email", event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
          {errors.email ? <span className="text-xs text-red-700">{errors.email}</span> : null}
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Telefono *
          <input
            type="tel"
            value={values.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
          {errors.phone ? <span className="text-xs text-red-700">{errors.phone}</span> : null}
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Puesto *
          <input
            type="text"
            value={values.position}
            onChange={(event) => handleChange("position", event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
          {errors.position ? <span className="text-xs text-red-700">{errors.position}</span> : null}
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          Anos de experiencia *
          <input
            type="number"
            min={0}
            value={values.experience_years}
            onChange={(event) =>
              handleChange("experience_years", event.target.value)
            }
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
          {errors.experience_years ? (
            <span className="text-xs text-red-700">{errors.experience_years}</span>
          ) : null}
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700">
          LinkedIn (opcional)
          <input
            type="url"
            value={values.linkedin_url}
            onChange={(event) => handleChange("linkedin_url", event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-gray-700 md:col-span-2">
          CV URL (opcional)
          <input
            type="url"
            value={values.cv_url}
            onChange={(event) => handleChange("cv_url", event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
        </label>
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
