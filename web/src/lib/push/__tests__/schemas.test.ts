import { describe, expect, it } from 'vitest';
import { subscriptionSchema } from '../schemas';

/* ブラウザの PushSubscription.toJSON() が返す形 */
const valid = {
	endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
	expirationTime: null,
	keys: {
		p256dh:
			'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
		auth: 'tBHItJI5svbpez7KI4CCXg'
	}
};

describe('subscriptionSchema', () => {
	it('ブラウザが返す形を受け取り、使わない項目は捨てる', () => {
		const result = subscriptionSchema.safeParse(valid);
		expect(result.success).toBe(true);
		expect(result.data).not.toHaveProperty('expirationTime');
	});

	it('https でない宛先を受け取らない', () => {
		const result = subscriptionSchema.safeParse({
			...valid,
			endpoint: 'http://169.254.169.254/latest'
		});
		expect(result.success).toBe(false);
	});

	it('base64url でない鍵を受け取らない', () => {
		const result = subscriptionSchema.safeParse({
			...valid,
			keys: { ...valid.keys, auth: 'not base64url!' }
		});
		expect(result.success).toBe(false);
	});

	it('鍵が欠けていれば受け取らない', () => {
		const result = subscriptionSchema.safeParse({ endpoint: valid.endpoint });
		expect(result.success).toBe(false);
	});
});
