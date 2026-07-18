import type { ApiSuccess } from "$lib/types";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  const data = (await res.json()) as ApiSuccess<{ status: string }>;
  if (!data.success) throw new Error("Health check failed");
  return data.data;
}
