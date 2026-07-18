import type {
  Note,
  Record as TalentRecord,
  RecordCreateInput,
  RecordFilters,
  RecordPatchInput,
} from "../types/record";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildUrl(path: string, params?: RecordFilters): string {
  if (!API_URL) {
    throw new ApiError("Falta configurar NEXT_PUBLIC_API_URL", 500);
  }

  const normalizedBase = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(normalizedPath, normalizedBase);

  if (params) {
    if (params.status) {
      url.searchParams.set("status", params.status);
    }
    if (params.stage) {
      url.searchParams.set("stage", params.stage);
    }
    if (params.search) {
      url.searchParams.set("search", params.search);
    }
    if (typeof params.page === "number") {
      url.searchParams.set("page", String(params.page));
    }
    if (typeof params.limit === "number") {
      url.searchParams.set("limit", String(params.limit));
    }
  }

  return url.toString();
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const data = payload as {
    message?: unknown;
    detail?: unknown;
    error?: unknown;
  };

  if (typeof data.message === "string" && data.message.trim().length > 0) {
    return data.message;
  }

  if (typeof data.detail === "string" && data.detail.trim().length > 0) {
    return data.detail;
  }

  if (typeof data.error === "string" && data.error.trim().length > 0) {
    return data.error;
  }

  return fallback;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  params?: RecordFilters,
): Promise<T> {
  const url = buildUrl(path, params);
  console.info("[api.request]", options.method ?? "GET", url);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });

    const contentType = response.headers.get("content-type") ?? "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      const fallback = response.statusText || "Error HTTP";
      throw new ApiError(extractErrorMessage(data, fallback), response.status);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new ApiError(error.message, 0);
    }

    throw new ApiError("Error de red desconocido", 0);
  }
}

export async function getRecords(filters: RecordFilters = {}): Promise<TalentRecord[]> {
  const payload = await request<{ data: TalentRecord[] }>(
    "/records",
    { method: "GET" },
    filters,
  );

  return Array.isArray(payload.data) ? payload.data : [];
}

export async function getRecord(id: string): Promise<TalentRecord> {
  return request<TalentRecord>(`/records/${id}`, { method: "GET" });
}

export async function createRecord(data: RecordCreateInput): Promise<TalentRecord> {
  return request<TalentRecord>("/records", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function replaceRecord(
  id: string,
  data: RecordCreateInput,
): Promise<TalentRecord> {
  return request<TalentRecord>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function patchRecord(
  id: string,
  data: RecordPatchInput,
): Promise<TalentRecord> {
  return request<TalentRecord>(`/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getNotes(id: string): Promise<Note[]> {
  return request<Note[]>(`/records/${id}/notes`, { method: "GET" });
}

export async function addNote(id: string, content: string): Promise<Note> {
  return request<Note>(`/records/${id}/notes`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export async function deleteNote(id: string, noteId: string): Promise<void> {
  await request<unknown>(`/records/${id}/notes/${noteId}`, { method: "DELETE" });
}
