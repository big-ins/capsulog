import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDb } from '$lib/common/testing/d1';
import { deleteSubscription, saveSubscription } from '../subscriptions.server';

let db: D1Database;

beforeEach(async () => {
	db = createTestDb();
	for (const id of [1, 2]) {
		await db
			.prepare(
				`INSERT INTO users (id, name, email, emailVerified, createdAt, updatedAt)
				 VALUES (?, ?, ?, 1, '', '')`
			)
			.bind(id, `ユーザー${id}`, `user${id}@example.com`)
			.run();
	}
});

function subscription(endpoint: string, p256dh = 'key', auth = 'secret') {
	return { endpoint, keys: { p256dh, auth } };
}

async function rows() {
	const { results } = await db
		.prepare('SELECT user_id, endpoint, p256dh FROM push_subscriptions ORDER BY endpoint')
		.all<{ user_id: number; endpoint: string; p256dh: string }>();
	return results;
}

describe('saveSubscription', () => {
	it('端末ごとに宛先を持つ', async () => {
		await saveSubscription(db, 1, subscription('https://push.example/a'));
		await saveSubscription(db, 1, subscription('https://push.example/b'));
		expect((await rows()).map((row) => row.endpoint)).toEqual([
			'https://push.example/a',
			'https://push.example/b'
		]);
	});

	it('同じ宛先を送り直しても行を増やさず、鍵を新しくする', async () => {
		await saveSubscription(db, 1, subscription('https://push.example/a', 'old'));
		await saveSubscription(db, 1, subscription('https://push.example/a', 'new'));
		expect(await rows()).toEqual([
			{ user_id: 1, endpoint: 'https://push.example/a', p256dh: 'new' }
		]);
	});

	it('同じ端末で別の人が登録したら、持ち主を付け替える', async () => {
		await saveSubscription(db, 1, subscription('https://push.example/a'));
		await saveSubscription(db, 2, subscription('https://push.example/a'));
		expect((await rows()).map((row) => row.user_id)).toEqual([2]);
	});
});

describe('deleteSubscription', () => {
	it('自分の宛先を消す', async () => {
		await saveSubscription(db, 1, subscription('https://push.example/a'));
		await deleteSubscription(db, 1, 'https://push.example/a');
		expect(await rows()).toEqual([]);
	});

	it('他人の宛先は消さない', async () => {
		await saveSubscription(db, 1, subscription('https://push.example/a'));
		await deleteSubscription(db, 2, 'https://push.example/a');
		expect(await rows()).toHaveLength(1);
	});
});
