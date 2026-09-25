import { z } from 'zod';

/*
 * 送信バッチはこの URL へ本文を送る。
 * https に限り、手で書き換えた宛先で任意の場所へ送らせない
 */
const endpoint = z.url({ protocol: /^https$/ }).max(2048);

/* 鍵は base64url。長さはブラウザが作る値に余裕を持たせた上限 */
const key = z
	.string()
	.regex(/^[A-Za-z0-9_-]+$/)
	.max(256);

/** PushSubscription.toJSON() の形。ほかの項目は使わないので捨てる */
export const subscriptionSchema = z.object({
	endpoint,
	keys: z.object({ p256dh: key, auth: key })
});

export const unsubscribeSchema = z.object({ endpoint });

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
