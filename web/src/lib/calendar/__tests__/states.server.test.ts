import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestDb } from '$lib/common/testing/d1';
import { setState } from '../states.server';

let db: D1Database;
const USER = 1;
const PRODUCT = 1;

beforeEach(async () => {
	db = createTestDb();
	await db
		.prepare(
			`INSERT INTO users (id, name, email, emailVerified, createdAt, updatedAt)
			 VALUES (?, 'テスト', 'test@example.com', 1, '', '')`
		)
		.bind(USER)
		.run();
	await db
		.prepare(
			`INSERT INTO products
				(id, maker_id, source_id, name, official_url, content_hash, fetched_at, created_at, updated_at)
			 VALUES (?, (SELECT id FROM makers WHERE code = 'kitan'), 's1', '商品', 'https://example.com', '', '', '', '')`
		)
		.bind(PRODUCT)
		.run();
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

/** この時刻に操作したことにする */
async function at(time: string, kind: 'favorited' | 'remind', value: boolean) {
	vi.setSystemTime(new Date(time));
	await setState(db, USER, PRODUCT, kind, value);
}

async function row() {
	return db
		.prepare(
			'SELECT remind_at, notified_at FROM user_product_states WHERE user_id = ? AND product_id = ?'
		)
		.bind(USER, PRODUCT)
		.first<{ remind_at: string | null; notified_at: string | null }>();
}

/** 送ったことにする。送るのはバッチの仕事なので、ここでは直接書く */
async function markNotified(time: string) {
	await db.prepare('UPDATE user_product_states SET notified_at = ?').bind(time).run();
}

describe('setState のリマインドの時刻', () => {
	it('付けた時刻を残す', async () => {
		await at('2026-09-01T00:00:00Z', 'remind', true);
		expect(await row()).toEqual({ remind_at: '2026-09-01T00:00:00.000Z', notified_at: null });
	});

	it('先にお気に入りを付けていても、リマインドを付けた時刻になる', async () => {
		await at('2026-09-01T00:00:00Z', 'favorited', true);
		expect((await row())?.remind_at).toBeNull();
		await at('2026-09-10T00:00:00Z', 'remind', true);
		expect((await row())?.remind_at).toBe('2026-09-10T00:00:00.000Z');
	});

	it('同じ値が二重に届いても、付けた時刻と送った時刻を変えない', async () => {
		await at('2026-09-01T00:00:00Z', 'remind', true);
		await markNotified('2026-09-05T00:00:00.000Z');
		await at('2026-09-10T00:00:00Z', 'remind', true);
		expect(await row()).toEqual({
			remind_at: '2026-09-01T00:00:00.000Z',
			notified_at: '2026-09-05T00:00:00.000Z'
		});
	});

	it('お気に入りだけ切り替えても、リマインドの時刻を変えない', async () => {
		await at('2026-09-01T00:00:00Z', 'remind', true);
		await at('2026-09-10T00:00:00Z', 'favorited', true);
		expect((await row())?.remind_at).toBe('2026-09-01T00:00:00.000Z');
	});

	it('外すと両方を空にし、付け直すと送り直せる', async () => {
		await at('2026-09-01T00:00:00Z', 'remind', true);
		await at('2026-09-01T00:00:00Z', 'favorited', true);
		await markNotified('2026-09-05T00:00:00.000Z');
		await at('2026-09-10T00:00:00Z', 'remind', false);
		expect(await row()).toEqual({ remind_at: null, notified_at: null });
		await at('2026-09-12T00:00:00Z', 'remind', true);
		expect(await row()).toEqual({ remind_at: '2026-09-12T00:00:00.000Z', notified_at: null });
	});
});
