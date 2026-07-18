import { useCallback, useEffect, useState } from "react";

import { ApiError, getRecord } from "../lib/api";
import type { Record as TalentRecord } from "../types/record";

interface UseCandidateResult {
  data: TalentRecord | null;
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

  return new ApiError("Error inesperado al cargar la candidatura", 0);
}

export function useCandidate(id: string): UseCandidateResult {
  const [data, setData] = useState<TalentRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const refetch = useCallback(async () => {
    if (!id) {
      setData(null);
      setError(new ApiError("ID de candidatura requerido", 400));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const record = await getRecord(id);
      setData(record);
    } catch (caughtError) {
      setError(toApiError(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
