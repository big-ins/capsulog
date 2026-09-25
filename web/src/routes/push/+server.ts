import { error } from '@sveltejs/kit';
import { subscriptionSchema, unsubscribeSchema } from '$lib/push/schemas';
import { deleteSubscription, saveSubscription } from '$lib/push/subscriptions.server';
import type { RequestHandler } from './$types';

/*
 * 通知の宛先の受け口。リマインドのボタン・ホーム・設定画面のどこからも呼ぶ。
 * ページの action に置くと、他のページから URL で名指しすることになる
 */

/** ログインしている人と、届いた本文を取り出す。どちらかが欠ければ止める */
async function read(event: Parameters<RequestHandler>[0]) {
	const db = event.platform?.env.DB;
	if (!db) error(500, 'D1 に接続できない');
	if (!event.locals.user) error(401);
	// Better Auth は id を文字列で返す。D1 の列は INTEGER なので戻す
	const userId = Number(event.locals.user.id);
	const body: unknown = await event.request.json().catch(() => null);
	return { db, userId, body };
}

export const POST: RequestHandler = async (event) => {
	const { db, userId, body } = await read(event);
	const parsed = subscriptionSchema.safeParse(body);
	if (!parsed.success) error(400);
	await saveSubscription(db, userId, parsed.data);
	return new Response(null, { status: 204 });
};

export const DELETE: RequestHandler = async (event) => {
	const { db, userId, body } = await read(event);
	const parsed = unsubscribeSchema.safeParse(body);
	if (!parsed.success) error(400);
	await deleteSubscription(db, userId, parsed.data.endpoint);
	return new Response(null, { status: 204 });
};
