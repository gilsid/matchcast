const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export async function getHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}
