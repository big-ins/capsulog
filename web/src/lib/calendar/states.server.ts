import { error, fail, type RequestEvent } from '@sveltejs/kit';

/** 商品に対して付けられる状態 */
export type StateKind = 'favorited' | 'remind';

const KINDS = new Set<string>(['favorited', 'remind']);

function isStateKind(value: unknown): value is StateKind {
	return typeof value === 'string' && KINDS.has(value);
}

/**
 * 状態を書き換える action。押せる画面が複数あるので、ここで1つだけ持つ。
 * 各ページの actions に `{ setState: setStateAction }` として置く。
 */
export async function setStateAction(event: RequestEvent) {
	const db = event.platform?.env.DB;
	if (!db) error(500, 'D1 に接続できない');
	// 押せるのは登録した人だけ。画面でも出し分けるが、送られてきた分もここで弾く
	if (!event.locals.user) return fail(401);

	const form = await event.request.formData();
	const productId = Number(form.get('productId'));
	const kind = form.get('kind');
	if (!Number.isInteger(productId) || !isStateKind(kind)) return fail(400);

	const value = form.get('value') === '1';
	await setState(db, Number(event.locals.user.id), productId, kind, value);
	return { ok: true };
}

/**
 * 状態を指定の値にする。
 *
 * 切り替えではなく値を受け取る。連打で送信が重なっても結果が変わらない。
 * 行は必要になったときだけ作り、どちらも外れたら消す。
 * CHECK 制約が両方 0 の行を許さないため、UPDATE で 0 にはできない。
 */
export async function setState(
	db: D1Database,
	userId: number,
	productId: number,
	kind: StateKind,
	value: boolean
): Promise<void> {
	const current = await db
		.prepare(
			'SELECT favorited, remind FROM user_product_states WHERE user_id = ? AND product_id = ?'
		)
		.bind(userId, productId)
		.first<{ favorited: number; remind: number }>();

	const next = {
		favorited: kind === 'favorited' ? value : Boolean(current?.favorited),
		remind: kind === 'remind' ? value : Boolean(current?.remind)
	};

	if (!next.favorited && !next.remind) {
		await db
			.prepare('DELETE FROM user_product_states WHERE user_id = ? AND product_id = ?')
			.bind(userId, productId)
			.run();
		return;
	}

	// 同じ商品に2行を作らない。UNIQUE インデックスと合わせて upsert する
	const now = new Date().toISOString();
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
}
