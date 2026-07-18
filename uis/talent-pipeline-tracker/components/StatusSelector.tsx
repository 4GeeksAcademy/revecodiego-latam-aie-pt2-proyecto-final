"use client";

import { statusLabels } from "../lib/labels";
import type { RecordStatus } from "../types/record";

interface StatusSelectorProps {
  value: RecordStatus;
  onChange: (value: RecordStatus) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
}

const statusOptions = Object.keys(statusLabels) as RecordStatus[];

export default function StatusSelector({
  value,
  onChange,
  id,
  name,
  disabled = false,
}: StatusSelectorProps) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as RecordStatus)}
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
    >
      {statusOptions.map((status) => (
        <option key={status} value={status}>
          {statusLabels[status]}
        </option>
      ))}
    </select>
  );
}
