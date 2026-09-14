import { request } from './request';

export async function getHealth(fetchFn = fetch): Promise<{ status: string }> {
	return await request<{ status: string }>('/health', undefined, fetchFn);
}
