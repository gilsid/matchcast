import type { ApiSuccess } from '$lib/types';

export async function getHealth(): Promise<{ status: string }> {
	const res = await fetch('/api/health');
	const data = (await res.json()) as ApiSuccess<{ status: string }>;
	if (!data.success) throw new Error('Health check failed');
	return data.data;
}
