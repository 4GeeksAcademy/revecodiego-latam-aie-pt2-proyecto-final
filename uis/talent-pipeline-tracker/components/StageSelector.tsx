"use client";

import { stageLabels } from "../lib/labels";
import type { RecordStage } from "../types/record";

interface StageSelectorProps {
  value: RecordStage;
  onChange: (value: RecordStage) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
}

const stageOptions = Object.keys(stageLabels) as RecordStage[];

export default function StageSelector({
  value,
  onChange,
  id,
  name,
  disabled = false,
}: StageSelectorProps) {
  return (
    <select
      id={id}
      name={name}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as RecordStage)}
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
    >
      {stageOptions.map((stage) => (
        <option key={stage} value={stage}>
          {stageLabels[stage]}
        </option>
      ))}
    </select>
  );
}
