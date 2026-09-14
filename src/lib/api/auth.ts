import { request } from './request';

export interface AuthUser {
	id: string;
	email: string;
	name: string;
	createdAt: string;
}

export interface AuthSession {
	token: string;
	user: AuthUser;
}

export async function apiRegister(email: string, password: string, name: string) {
	return await request<AuthUser>('/auth/register', {
		method: 'POST',
		body: JSON.stringify({ email, password, name })
	});
}

export async function apiLogin(email: string, password: string) {
	return await request<AuthSession>('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ email, password })
	});
}
