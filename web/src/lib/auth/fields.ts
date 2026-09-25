/* サーバの設定とクライアントの型で同じものを使う。auth.server.ts は画面から読めない */
export const userFields = {
	xHandle: { type: 'string', required: false, input: false },
	agreedTermsVersion: { type: 'string', required: false },
	// 退会の印。Better Auth は見ないので、弾くのは自分でやる
	deletedAt: { type: 'date', required: false, input: false }
} as const;
