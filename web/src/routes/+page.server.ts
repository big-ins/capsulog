import { error } from '@sveltejs/kit';
import { currentYearMonth, inReleasePeriod } from '$lib/calendar/format';
import { countProducts, listMakers, listRemindsOf } from '$lib/calendar/queries.server';
import { setStateAction } from '$lib/calendar/states.server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, locals }) => {
	const db = platform?.env.DB;
	if (!db) error(500, 'D1 に接続できない');

	const thisMonth = currentYearMonth(0);
	const [counts, makers, reminds] = await Promise.all([
		countProducts(db, thisMonth),
		listMakers(db),
		locals.user ? listRemindsOf(db, Number(locals.user.id), thisMonth) : []
	]);

	return {
		makerCount: makers.length,
		productCount: counts.total,
		/*
		 * いま発売期間の中にあるリマインド。通知は見逃すと戻れないので、期間の間はここに並べる。
		 * 期間に入ってから付けたものには通知が届かないため、ここが唯一の知らせになる
		 */
		releasing: reminds.filter((item) =>
			inReleasePeriod(item.yearMonth, item.precision, item.detail)
		),
		// 棚はまだ無い。作ったら自分の登録数を返す
		collectionCount: 0
	};
};

// 並べたカードからリマインドを外せるようにする
export const actions: Actions = { setState: setStateAction };
