/**
 * Better Auth が持たないユーザーの列。
 * サーバの設定とクライアントの型で同じものを使う
 */
export const userFields = {
	xHandle: { type: 'string', required: false, input: false },
	icalToken: { type: 'string', required: false, input: false },
	agreedTermsVersion: { type: 'string', required: false },
	// 退会の印。Better Auth は見ないので、弾くのは自分でやる
	deletedAt: { type: 'date', required: false, input: false }
} as const;
