const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: string;
  code?: string;
  details?: { field: string; message: string }[];
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const res = await fetch(url, {
    ...options,
    credentials: options.credentials || "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  return res;
}

// ── Typed helpers ─────────────────────────────────────────────────────────────

export async function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  let url = path;
  if (params) {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)])
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const res = await apiFetch(url);
  if (!res.ok) {
    const body: ApiError = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
    throw new ApiRequestError(res.status, body.error, body.code, body.details);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
    throw new ApiRequestError(res.status, err.error, err.code, err.details);
  }
  return res.json() as Promise<T>;
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await apiFetch(path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
    throw new ApiRequestError(res.status, err.error, err.code, err.details);
  }
  return res.json() as Promise<T>;
}

export async function apiDelete(path: string): Promise<void> {
  const res = await apiFetch(path, { method: "DELETE" });
  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
    throw new ApiRequestError(res.status, err.error, err.code, err.details);
  }
}

// ── Multipart form upload (for comprovante) ───────────────────────────────────

export async function apiUpload<T>(path: string, formData: FormData, method: "POST" | "PUT" = "POST"): Promise<T> {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    credentials: "include",
    body: formData,
    // No Content-Type header — browser sets it automatically with boundary
  });
  if (!res.ok) {
    const err: ApiError = await res.json().catch(() => ({ error: `Erro ${res.status}` }));
    throw new ApiRequestError(res.status, err.error, err.code, err.details);
  }
  return res.json() as Promise<T>;
}

// ── Error class ───────────────────────────────────────────────────────────────

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: { field: string; message: string }[]
  ) {
    super(message);
    this.name = "ApiRequestError";
  }

  /** Returns a human-readable summary for toast notifications */
  toUserMessage(): string {
    if (this.details?.length) {
      return this.details.map((d) => `${d.field}: ${d.message}`).join(" · ");
    }
    return this.message;
  }

  get isUnauthorized() { return this.status === 401; }
  get isForbidden()    { return this.status === 403; }
  get isNotFound()     { return this.status === 404; }
  get isConflict()     { return this.status === 409; }
  get isValidation()   { return this.status === 422; }
  get isRateLimit()    { return this.status === 429; }
}

// ── Pagination helpers ────────────────────────────────────────────────────────

export function buildPageParams(page: number, limit = 20) {
  return { page, limit };
}

export function hasNextPage(meta: PaginatedResponse<unknown>["meta"]) {
  return meta.page < meta.totalPages;
}
