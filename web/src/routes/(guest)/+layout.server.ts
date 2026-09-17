import { redirect } from '@sveltejs/kit';
import { safeRedirect } from '$lib/auth/form';
import type { LayoutServerLoad } from './$types';

/* ログインの前だけ通す画面。済んでいる人が開いても用がないので、元の場所へ返す */
export const load: LayoutServerLoad = async ({ locals, url }) => {
	const redirectTo = safeRedirect(url.searchParams.get('redirect'));
	if (locals.user) redirect(303, redirectTo);
	return { redirectTo };
};
