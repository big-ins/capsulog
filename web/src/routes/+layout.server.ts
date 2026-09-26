import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	return {
		user: locals.user,
		// 通知を許可するときブラウザに渡す。どの画面からも許可を求めるので、ここで配る
		vapidPublicKey: platform?.env.VAPID_PUBLIC_KEY ?? null
	};
};
