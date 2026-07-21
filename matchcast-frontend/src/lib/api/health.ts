import type { ApiSuccess } from '$lib/types';

const DEV_BASE = `http://localhost:${'3001'}`;
const API_URL = import.meta.env.VITE_API_URL || DEV_BASE;

export async function getHealth(): Promise<{ status: string }> {
	const res = await fetch(`${API_URL}/health`);
	const data = (await res.json()) as ApiSuccess<{ status: string }>;
	if (!data.success) throw new Error('Health check failed');
	return data.data;
}
