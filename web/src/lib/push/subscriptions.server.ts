import type { SubscriptionInput } from './schemas';

/**
 * 宛先を保存する。
 *
 * 同じ宛先がすでにあれば、持ち主ごと上書きする。
 * 同じ端末で別の人がログインし直したとき、前の人の通知が届かないようにする
 */
export async function saveSubscription(
	db: D1Database,
	userId: number,
	subscription: SubscriptionInput
): Promise<void> {
	const now = new Date().toISOString();
	await db
		.prepare(
			`INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?)
			 ON CONFLICT (endpoint) DO UPDATE SET
			   user_id = excluded.user_id,
			   p256dh = excluded.p256dh,
			   auth = excluded.auth,
			   updated_at = excluded.updated_at`
		)
		.bind(userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, now, now)
		.run();
}

/** 宛先を消す。消せるのは自分の宛先だけ */
export async function deleteSubscription(
	db: D1Database,
	userId: number,
	endpoint: string
): Promise<void> {
	await db
		.prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?')
		.bind(userId, endpoint)
		.run();
}
