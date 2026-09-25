import { describe, expect, it } from 'vitest';
import { readMessage } from '../message';

const FALLBACK = { title: 'カプセログ', body: '', url: '/' };

describe('readMessage', () => {
	it('送信バッチの本文をそのまま読む', () => {
		const message = { title: '今週発売予定', body: 'ちいかわ マスコット', url: '/products/1' };
		expect(readMessage(() => message)).toEqual(message);
	});

	it('本文が読めなければ、サイト名だけの通知にする', () => {
		expect(
			readMessage(() => {
				throw new SyntaxError('JSON ではない');
			})
		).toEqual(FALLBACK);
		expect(readMessage(() => undefined)).toEqual(FALLBACK);
		expect(readMessage(() => ({ title: 1, body: 'x' }))).toEqual(FALLBACK);
	});

	it('行き先がサイトの外なら、トップに差し替える', () => {
		const read = (url: unknown) => readMessage(() => ({ title: 't', body: 'b', url })).url;
		expect(read('https://example.com/')).toBe('/');
		expect(read('//example.com/')).toBe('/');
		expect(read(undefined)).toBe('/');
	});
});
