"use client";

import { useSearchParams } from "next/navigation";

import { stageLabels, statusLabels } from "../lib/labels";
import { useCandidates } from "../hooks/useCandidates";
import type { RecordStage, RecordStatus } from "../types/record";
import CandidateRow from "./CandidateRow";
import ErrorState from "./ErrorState";
import LoadingState from "./LoadingState";

function isRecordStatus(value: string): value is RecordStatus {
  return value in statusLabels;
}

function isRecordStage(value: string): value is RecordStage {
  return value in stageLabels;
}

export default function CandidateList() {
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status") ?? "";
  const stageParam = searchParams.get("stage") ?? "";
  const queryParam = searchParams.get("q") ?? "";

  const filters = {
    status: isRecordStatus(statusParam) ? statusParam : undefined,
    stage: isRecordStage(stageParam) ? stageParam : undefined,
    search: queryParam || undefined,
  };

  const { data, isLoading, error, refetch } = useCandidates(filters);

  if (isLoading) {
    return <LoadingState message="Cargando candidaturas..." />;
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
        No hay candidaturas para los filtros seleccionados.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((candidate) => (
        <CandidateRow key={candidate.id} candidate={candidate} />
      ))}
    </ul>
  );
}
