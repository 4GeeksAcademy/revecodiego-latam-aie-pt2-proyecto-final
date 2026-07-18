"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { stageLabels, statusLabels } from "../lib/labels";
import type { RecordStage, RecordStatus } from "../types/record";

const statusOptions = Object.keys(statusLabels) as RecordStatus[];
const stageOptions = Object.keys(stageLabels) as RecordStage[];

function isRecordStatus(value: string): value is RecordStatus {
  return value in statusLabels;
}

function isRecordStage(value: string): value is RecordStage {
  return value in stageLabels;
}

export default function FiltersBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statusParam = searchParams.get("status") ?? "";
  const stageParam = searchParams.get("stage") ?? "";
  const queryParam = searchParams.get("q") ?? "";

  const statusValue = isRecordStatus(statusParam) ? statusParam : "";
  const stageValue = isRecordStage(stageParam) ? stageParam : "";

  const updateParam = (key: "status" | "stage" | "q", value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    const nextQuery = params.toString();
    router.replace(nextQuery ? `/?${nextQuery}` : "/");
  };

  return (
    <section className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-3">
      <label className="flex flex-col gap-1 text-sm text-gray-700">
        Estado
        <select
          value={statusValue}
          onChange={(event) => updateParam("status", event.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        >
          <option value="">Todos</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        Etapa
        <select
          value={stageValue}
          onChange={(event) => updateParam("stage", event.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        >
          <option value="">Todas</option>
          {stageOptions.map((stage) => (
            <option key={stage} value={stage}>
              {stageLabels[stage]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-700">
        Buscar por nombre o email
        <input
          type="search"
          value={queryParam}
          placeholder="Ej. maria@nexova.com"
          onChange={(event) => updateParam("q", event.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
        />
      </label>
    </section>
  );
}
