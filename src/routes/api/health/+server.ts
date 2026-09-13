import type { RequestHandler } from './$types';
import { ok } from '$lib/server/respond';

export const GET: RequestHandler = () => ok({ status: 'ok' });
