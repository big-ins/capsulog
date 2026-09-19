import { error } from '@sveltejs/kit';
import { currentYearMonth } from '$lib/calendar/format';
import { countProducts, listMakers } from '$lib/calendar/queries.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform?.env.DB;
	if (!db) error(500, 'D1 に接続できない');

	const [counts, makers] = await Promise.all([
		countProducts(db, currentYearMonth(0)),
		listMakers(db)
	]);

	return {
		makerCount: makers.length,
		productCount: counts.total,
		// 棚はまだ無い。作ったら自分の登録数を返す
		collectionCount: 0
	};
};
