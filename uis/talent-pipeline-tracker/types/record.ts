export type RecordStatus = "received" | "in_progress" | "selected" | "discarded";

export type RecordStage =
  | "pending"
  | "review"
  | "personal_interview"
  | "technical_interview"
  | "offer_presented";

export interface Record {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  experience_years: number;
  status: RecordStatus;
  stage: RecordStage;
  notes_count: number;
  applied_at: string;
  updated_at: string;
}

export interface RecordCreateInput {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url?: string | null;
  cv_url?: string | null;
  experience_years: number;
}

export interface RecordPatchInput {
  status?: RecordStatus;
  stage?: RecordStage;
}

export interface Note {
  id: string;
  content: string;
  created_at: string;
}

export interface RecordFilters {
  status?: RecordStatus;
  stage?: RecordStage;
  search?: string;
  page?: number;
  limit?: number;
}
