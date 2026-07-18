import { useCallback, useEffect, useState } from "react";

import { ApiError, getRecords } from "../lib/api";
import type {
  Record as TalentRecord,
  RecordFilters,
  RecordStage,
  RecordStatus,
} from "../types/record";

type CandidatesFilters = Pick<RecordFilters, "status" | "stage" | "search">;

interface UseCandidatesResult {
  data: TalentRecord[];
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0);
  }

  return new ApiError("Error inesperado al cargar candidaturas", 0);
}

export function useCandidates(filters: {
  status?: RecordStatus;
  stage?: RecordStage;
  search?: string;
}): UseCandidatesResult {
  const [data, setData] = useState<TalentRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const { status, stage, search } = filters;

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const query: CandidatesFilters = { status, stage, search };

    try {
      const records = await getRecords(query);
      setData(records);
    } catch (caughtError) {
      setError(toApiError(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, [search, stage, status]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
