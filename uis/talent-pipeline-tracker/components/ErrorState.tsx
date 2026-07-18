"use client";

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 p-4 text-red-800"
    >
      <p className="text-sm">{message || "Ocurrio un error inesperado."}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
      >
        Reintentar
      </button>
    </div>
  );
}
