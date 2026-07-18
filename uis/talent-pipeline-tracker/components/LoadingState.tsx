interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Cargando..." }: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite" className="py-6 text-center text-sm text-gray-600">
      {message}
    </div>
  );
}
