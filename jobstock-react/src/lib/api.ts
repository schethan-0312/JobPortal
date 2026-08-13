const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("jobstock_token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("jobstock_token", token);
  } else {
    localStorage.removeItem("jobstock_token");
  }
}

interface ApiOptions extends RequestInit {
  auth?: boolean;
}

export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) {
      finalHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_URL}${path}`, { 
    ...rest, 
    headers: finalHeaders,
    cache: 'no-store' 
  });

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      (body as { message?: string | string[] })?.message?.toString() ?? `Request failed with ${res.status}`;
    throw new ApiError(res.status, message, body);
  }

  return body as T;
}

export async function uploadFile<T = unknown>(path: string, file: File): Promise<T> {
  const token = getToken();
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const message =
      (body as { message?: string | string[] })?.message?.toString() ?? `Upload failed with ${res.status}`;
    throw new ApiError(res.status, message, body);
  }

  return body as T;
}

export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  try {
    const url = new URL(API_URL);
    return `${url.origin}${path}`;
  } catch {
    return `${API_URL.replace(/\/api.*$/, "")}${path}`;
  }
}

export const api = {
  get: <T = unknown>(path: string, options?: ApiOptions) => apiFetch<T>(path, { ...options, method: "GET" }),
  post: <T = unknown>(path: string, data?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T = unknown>(path: string, data?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  put: <T = unknown>(path: string, data?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, { ...options, method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  delete: <T = unknown>(path: string, options?: ApiOptions) => apiFetch<T>(path, { ...options, method: "DELETE" }),
};
