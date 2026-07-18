import { statusLabels } from "../lib/labels";
import type { RecordStatus } from "../types/record";

interface StatusBadgeProps {
  status: RecordStatus;
}

const statusStyles: Record<RecordStatus, string> = {
  received: "bg-slate-100 text-slate-800 border-slate-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  selected: "bg-emerald-100 text-emerald-800 border-emerald-200",
  discarded: "bg-rose-100 text-rose-800 border-rose-200",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
