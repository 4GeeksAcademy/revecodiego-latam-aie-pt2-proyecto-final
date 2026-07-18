"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import { useNotes } from "../hooks/useNotes";
import LoadingState from "./LoadingState";
import NoteItem from "./NoteItem";

interface NotesPanelProps {
  candidateId: string;
}

export default function NotesPanel({ candidateId }: NotesPanelProps) {
  const { notes, isLoading, error, addNote, deleteNote } = useNotes(candidateId);
  const [content, setContent] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    try {
      await addNote(trimmed);
      setContent("");
      showSuccess("Nota anadida.");
    } catch {
      // El hook ya expone el error para mostrarlo en pantalla.
    }
  };

  const handleDelete = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      showSuccess("Nota eliminada.");
    } catch {
      // El hook ya expone el error para mostrarlo en pantalla.
    }
  };

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Notas internas</h2>
        <p className="text-sm text-gray-600">
          Estas notas se muestran solo en el detalle del candidato.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <label htmlFor="note-content" className="text-sm font-medium text-gray-700">
          Nueva nota
        </label>
        <textarea
          id="note-content"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={3}
          placeholder="Escribe una nota interna..."
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
        <button
          type="submit"
          disabled={isLoading || content.trim().length === 0}
          className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Anadir nota
        </button>
      </form>

      {isLoading ? <LoadingState message="Cargando notas..." /> : null}
      {successMessage ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {successMessage}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error.message}
        </p>
      ) : null}

      {!isLoading && !error ? (
        notes.length > 0 ? (
          <ul className="space-y-2">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onDelete={handleDelete}
                isDeleting={isLoading}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">Todavia no hay notas internas.</p>
        )
      ) : null}
    </section>
  );
}
