import type { ApiSuccess, ApiErrorResponse } from "$lib/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string; createdAt: string };
}

export async function apiRegister(email: string, password: string, name: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
  const data = (await res.json()) as ApiSuccess<AuthResponse["user"]> | ApiErrorResponse;
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
  const data = (await res.json()) as ApiSuccess<AuthResponse> | ApiErrorResponse;
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}
