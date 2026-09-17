import { authMode } from '$lib/auth/form';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	return { mode: authMode(url.searchParams.get('mode')) };
};
