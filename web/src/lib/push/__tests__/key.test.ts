import { describe, expect, it } from 'vitest';
import { decodeKey } from '../key';

describe('decodeKey', () => {
	it('base64url をバイト列に戻す', () => {
		// 0xfb 0xff は base64 だと「+/」、base64url だと「-_」になる
		expect([...decodeKey('-_8')]).toEqual([0xfb, 0xff]);
	});

	it('パディングが無くても戻せる', () => {
		expect([...decodeKey('AQ')]).toEqual([1]);
		expect([...decodeKey('AQI')]).toEqual([1, 2]);
		expect([...decodeKey('AQID')]).toEqual([1, 2, 3]);
	});

	it('VAPID の公開鍵は 65 バイトで、先頭が 0x04', () => {
		const key = decodeKey(
			'BCuSLFDsz8jGsvvnehrreugY-8sXjPYmE7RUykGRYkD4ZZYkYP-J040QQLqnOalCH20KWKSR09z3xzJ7rTvdFwM'
		);
		expect(key.length).toBe(65);
		expect(key[0]).toBe(0x04);
	});
});
