import { error } from '@sveltejs/kit';
import { getProduct, listSeriesProducts } from '$lib/calendar/queries.server';
import { toggleStateAction } from '$lib/calendar/states.server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, params, locals }) => {
	const db = platform?.env.DB;
	if (!db) error(500, 'D1 に接続できない');

	const id = Number(params.id);
	if (!Number.isInteger(id)) error(404, '商品が見つかりません');

	const userId = locals.user ? Number(locals.user.id) : undefined;
	const product = await getProduct(db, id, userId);
	if (!product) error(404, '商品が見つかりません');

	const series = await listSeriesProducts(db, product, userId);
	return { product, series };
};

export const actions: Actions = { toggleState: toggleStateAction };
