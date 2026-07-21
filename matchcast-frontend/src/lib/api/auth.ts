import type { ApiSuccess, ApiErrorResponse } from '$lib/types';

interface AuthResponse {
	token: string;
	user: { id: string; email: string; name: string; createdAt: string };
}

const DEV_BASE = `http://localhost:${'3001'}`;
const BASE_URL = import.meta.env.VITE_API_URL || DEV_BASE;

function apiUrl(path: string): string {
	return `${BASE_URL}${path}`;
}

export async function apiRegister(email: string, password: string, name: string) {
	const res = await fetch(apiUrl('/auth/register'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password, name })
	});
	const data = (await res.json()) as ApiSuccess<AuthResponse['user']> | ApiErrorResponse;
	if (!data.success) throw new Error(data.error.message);
	return data.data;
}

export async function apiLogin(email: string, password: string) {
	const res = await fetch(apiUrl('/auth/login'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password }),
		credentials: 'include'
	});
	const data = (await res.json()) as ApiSuccess<AuthResponse> | ApiErrorResponse;
	if (!data.success) throw new Error(data.error.message);
	return data.data;
}
