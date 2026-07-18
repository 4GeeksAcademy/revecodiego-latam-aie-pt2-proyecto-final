import Link from "next/link";

import { stageLabels } from "../lib/labels";
import type { Record as TalentRecord } from "../types/record";
import StatusBadge from "./StatusBadge";

interface CandidateRowProps {
  candidate: TalentRecord;
}

export default function CandidateRow({ candidate }: CandidateRowProps) {
  return (
    <li>
      <Link
        href={`/candidates/${candidate.id}`}
        className="grid gap-2 rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:bg-gray-50 md:grid-cols-4 md:items-center"
      >
        <div>
          <p className="text-sm font-semibold text-gray-900">{candidate.full_name}</p>
          <p className="text-xs text-gray-600">{candidate.email}</p>
        </div>

        <p className="text-sm text-gray-700">{candidate.position}</p>

        <div>
          <StatusBadge status={candidate.status} />
        </div>

        <p className="text-sm text-gray-700">{stageLabels[candidate.stage]}</p>
      </Link>
    </li>
  );
}
