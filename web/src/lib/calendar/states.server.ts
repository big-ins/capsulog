import { error, fail, type RequestEvent } from '@sveltejs/kit';

/** 商品に対して付けられる状態 */
export type StateKind = 'favorited' | 'remind';

const KINDS = new Set<string>(['favorited', 'remind']);

function isStateKind(value: unknown): value is StateKind {
	return typeof value === 'string' && KINDS.has(value);
}

/**
 * 状態を切り替える action。押せる画面が複数あるので、ここで1つだけ持つ。
 * 各ページの actions に `{ toggleState: toggleStateAction }` として置く。
 */
export async function toggleStateAction(event: RequestEvent) {
	const db = event.platform?.env.DB;
	if (!db) error(500, 'D1 に接続できない');
	// 押せるのは登録した人だけ。画面でも出し分けるが、送られてきた分もここで弾く
	if (!event.locals.user) return fail(401);

	const form = await event.request.formData();
	const productId = Number(form.get('productId'));
	const kind = form.get('kind');
	if (!Number.isInteger(productId) || !isStateKind(kind)) return fail(400);

	return await toggleState(db, Number(event.locals.user.id), productId, kind);
}

/**
 * 状態を切り替える。付いていなければ付け、付いていれば外す。
 * 切り替えた後の値を返す。
 *
 * 行は必要になったときだけ作り、どちらも外れたら消す。
 * CHECK 制約が両方 0 の行を許さないため、UPDATE で 0 にはできない。
 */
export async function toggleState(
	db: D1Database,
	userId: number,
	productId: number,
	kind: StateKind
): Promise<{ favorited: boolean; remind: boolean }> {
	const current = await db
		.prepare(
			'SELECT favorited, remind FROM user_product_states WHERE user_id = ? AND product_id = ?'
		)
		.bind(userId, productId)
		.first<{ favorited: number; remind: number }>();

	const next = {
		favorited: kind === 'favorited' ? !current?.favorited : Boolean(current?.favorited),
		remind: kind === 'remind' ? !current?.remind : Boolean(current?.remind)
	};

	const now = new Date().toISOString();
	if (!next.favorited && !next.remind) {
		await db
			.prepare('DELETE FROM user_product_states WHERE user_id = ? AND product_id = ?')
			.bind(userId, productId)
			.run();
		return next;
	}

	// 同じ商品に2行を作らない。UNIQUE インデックスと合わせて upsert する
	await db
		.prepare(
			`INSERT INTO user_product_states
			   (user_id, product_id, favorited, remind, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?)
			 ON CONFLICT (user_id, product_id) DO UPDATE SET
			   favorited = excluded.favorited,
			   remind = excluded.remind,
			   updated_at = excluded.updated_at`
		)
		.bind(userId, productId, Number(next.favorited), Number(next.remind), now, now)
		.run();
	return next;
}
