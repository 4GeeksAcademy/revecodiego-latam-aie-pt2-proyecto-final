"use client";

import type { Note } from "../types/record";

interface NoteItemProps {
  note: Note;
  onDelete: (noteId: string) => void;
  isDeleting?: boolean;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function NoteItem({ note, onDelete, isDeleting = false }: NoteItemProps) {
  return (
    <li className="rounded-md border border-gray-200 bg-white p-3">
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-xs text-gray-500">{formatDate(note.created_at)}</p>
        <button
          type="button"
          onClick={() => onDelete(note.id)}
          disabled={isDeleting}
          className="rounded border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Eliminar
        </button>
      </div>
      <p className="text-sm text-gray-800">{note.content}</p>
    </li>
  );
}
