"use client";

export type ApiError = Error & { status?: number };
const TOKEN_KEY = "rl_b2b_token";

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();

  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    const error: ApiError = new Error(text || response.statusText);
    error.status = response.status;
    throw error;
  }

  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) return response.text() as T;
  return response.json() as Promise<T>;
}

export async function downloadWithAuth(path: string, filename: string) {
  const token = getAuthToken();
  const response = await fetch(`/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!response.ok) throw new Error(await response.text());
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
