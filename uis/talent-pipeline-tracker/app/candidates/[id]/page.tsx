"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";

import CandidateForm from "../../../components/CandidateForm";
import ErrorState from "../../../components/ErrorState";
import LoadingState from "../../../components/LoadingState";
import NotesPanel from "../../../components/NotesPanel";
import StageSelector from "../../../components/StageSelector";
import StatusBadge from "../../../components/StatusBadge";
import StatusSelector from "../../../components/StatusSelector";
import { stageLabels } from "../../../lib/labels";
import { ApiError, patchRecord } from "../../../lib/api";
import type {
  Record as TalentRecord,
  RecordStage,
  RecordStatus,
} from "../../../types/record";
import { useCandidate } from "../../../hooks/useCandidate";

interface CandidateDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const { id } = use(params);
  const { data, isLoading, error, refetch } = useCandidate(id);
  const [candidate, setCandidate] = useState<TalentRecord | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPatching, setIsPatching] = useState(false);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (data) {
      setCandidate(data);
    }
  }, [data]);

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

  const handleStatusChange = async (status: RecordStatus) => {
    if (!candidate) {
      return;
    }

    setPatchError(null);
    setSuccessMessage(null);
    setIsPatching(true);

    try {
      const updated = await patchRecord(candidate.id, { status });
      setCandidate(updated);
      showSuccess("Estado actualizado.");
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : "No se pudo actualizar el estado.";
      setPatchError(message);
    } finally {
      setIsPatching(false);
    }
  };

  const handleStageChange = async (stage: RecordStage) => {
    if (!candidate) {
      return;
    }

    setPatchError(null);
    setSuccessMessage(null);
    setIsPatching(true);

    try {
      const updated = await patchRecord(candidate.id, { stage });
      setCandidate(updated);
      showSuccess("Etapa actualizada.");
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : "No se pudo actualizar la etapa.";
      setPatchError(message);
    } finally {
      setIsPatching(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Cargando detalle de candidatura..." />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={() => void refetch()} />;
  }

  if (!candidate) {
    return (
      <ErrorState
        message="No se encontro la candidatura solicitada."
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-600">Candidato</p>
          <h1 className="text-2xl font-semibold text-gray-900">{candidate.full_name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Volver al listado
          </Link>
          <button
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            {isEditing ? "Cerrar edicion" : "Editar candidatura"}
          </button>
        </div>
      </div>

      {patchError ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {patchError}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {successMessage}
        </p>
      ) : null}

      <section className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">ID</p>
          <p className="text-sm text-gray-900">{candidate.id}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
          <p className="text-sm text-gray-900">{candidate.email}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">Telefono</p>
          <p className="text-sm text-gray-900">{candidate.phone}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">Puesto</p>
          <p className="text-sm text-gray-900">{candidate.position}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">Anos de experiencia</p>
          <p className="text-sm text-gray-900">{candidate.experience_years}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">LinkedIn</p>
          <p className="text-sm text-gray-900">{candidate.linkedin_url || "No indicado"}</p>
        </div>

        <div className="space-y-1 md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-gray-500">CV URL</p>
          <p className="text-sm text-gray-900">{candidate.cv_url || "No indicado"}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-gray-500">Estado actual</p>
          <StatusBadge status={candidate.status} />
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-gray-500">Cambiar estado</p>
          <StatusSelector
            value={candidate.status}
            onChange={(value) => void handleStatusChange(value)}
            disabled={isPatching}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-gray-500">Etapa actual</p>
          <p className="text-sm text-gray-900">{stageLabels[candidate.stage]}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-gray-500">Cambiar etapa</p>
          <StageSelector
            value={candidate.stage}
            onChange={(value) => void handleStageChange(value)}
            disabled={isPatching}
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">Notas internas</p>
          <p className="text-sm text-gray-900">{candidate.notes_count}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-gray-500">Aplicado el</p>
          <p className="text-sm text-gray-900">{candidate.applied_at}</p>
        </div>

        <div className="space-y-1 md:col-span-2">
          <p className="text-xs uppercase tracking-wide text-gray-500">Ultima actualizacion</p>
          <p className="text-sm text-gray-900">{candidate.updated_at}</p>
        </div>
      </section>

      {isEditing ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Editar candidatura</h2>
          <CandidateForm
            mode="edit"
            initialData={candidate}
            redirectOnSuccess={false}
            onSuccess={(updatedRecord) => {
              setCandidate(updatedRecord);
            }}
          />
        </section>
      ) : null}

      <NotesPanel candidateId={candidate.id} />
    </main>
  );
}
