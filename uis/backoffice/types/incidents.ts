export type IncidentStatus = "open" | "in_progress" | "resolved" | "discarded";

export type IncidentCategory =
  | "technical_failure"
  | "process_error"
  | "client_complaint"
  | "candidate_issue"
  | "staff_issue"
  | "sla_breach"
  | "data_quality"
  | "other";

export type IncidentOrigin = "customer" | "branch" | "internal";

export type IncidentBranch = "central" | "valencia_operations" | "miami_office" | "remote";

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  status: IncidentStatus;
  origin: IncidentOrigin;
  branch: IncidentBranch;
  created_at: string;
  updated_at: string;
}

export interface IncidentCreatePayload {
  title: string;
  description: string;
  category: IncidentCategory;
  origin: IncidentOrigin;
  branch: IncidentBranch;
}

export interface IncidentSummary {
  total: number;
  by_status: {
    open: number;
    in_progress: number;
    resolved: number;
    discarded: number;
  };
  by_category: {
    technical_failure: number;
    process_error: number;
    client_complaint: number;
    candidate_issue: number;
    staff_issue: number;
    sla_breach: number;
    data_quality: number;
    other: number;
  };
  by_origin: {
    customer: number;
    branch: number;
    internal: number;
  };
  by_branch: {
    central: number;
    valencia_operations: number;
    miami_office: number;
    remote: number;
  };
}

export const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  technical_failure: "Fallo técnico",
  process_error: "Error de proceso",
  client_complaint: "Reclamación de cliente",
  candidate_issue: "Incidencia de candidato",
  staff_issue: "Incidencia de personal",
  sla_breach: "Incumplimiento de SLA",
  data_quality: "Calidad de datos",
  other: "Otro",
};

export const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Abierta",
  in_progress: "En progreso",
  resolved: "Resuelta",
  discarded: "Descartada",
};

export const ORIGIN_LABELS: Record<IncidentOrigin, string> = {
  customer: "Cliente",
  branch: "Sucursal",
  internal: "Interno",
};

export const BRANCH_LABELS: Record<IncidentBranch, string> = {
  central: "Central — Sede Valencia",
  valencia_operations: "Valencia — Operaciones",
  miami_office: "Miami Office",
  remote: "Remoto (empleado sin sede fija)",
};
