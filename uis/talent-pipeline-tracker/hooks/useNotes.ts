import { useCallback, useEffect, useState } from "react";

import {
  addNote as apiAddNote,
  ApiError,
  deleteNote as apiDeleteNote,
  getNotes,
} from "../lib/api";
import type { Note } from "../types/record";

interface UseNotesResult {
  notes: Note[];
  isLoading: boolean;
  error: ApiError | null;
  addNote: (content: string) => Promise<Note>;
  deleteNote: (noteId: string) => Promise<void>;
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message, 0);
  }

  return new ApiError("Error inesperado al gestionar notas", 0);
}

export function useNotes(id: string): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<ApiError | null>(null);

  const loadNotes = useCallback(async () => {
    if (!id) {
      setNotes([]);
      setError(new ApiError("ID de candidatura requerido", 400));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getNotes(id);
      setNotes(data);
    } catch (caughtError) {
      setError(toApiError(caughtError));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const addNote = useCallback(
    async (content: string): Promise<Note> => {
      if (!id) {
        const missingIdError = new ApiError("ID de candidatura requerido", 400);
        setError(missingIdError);
        throw missingIdError;
      }

      setIsLoading(true);
      setError(null);

      try {
        const newNote = await apiAddNote(id, content);
        setNotes((currentNotes) => [newNote, ...currentNotes]);
        return newNote;
      } catch (caughtError) {
        const apiError = toApiError(caughtError);
        setError(apiError);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [id],
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!id) {
        const missingIdError = new ApiError("ID de candidatura requerido", 400);
        setError(missingIdError);
        throw missingIdError;
      }

      setIsLoading(true);
      setError(null);

      try {
        await apiDeleteNote(id, noteId);
        setNotes((currentNotes) =>
          currentNotes.filter((note) => note.id !== noteId),
        );
      } catch (caughtError) {
        const apiError = toApiError(caughtError);
        setError(apiError);
        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [id],
  );

  return { notes, isLoading, error, addNote, deleteNote };
}
