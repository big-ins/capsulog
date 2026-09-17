import { PASSWORD_MIN_LENGTH } from './schemas';

/*
 * アカウントの有無を伝えない文。
 * 「登録済み」「未確認」「パスワードが違う」を区別して出すと、
 * そのアドレスが登録されていることを教えることになる
 */
const UNAUTHORIZED = 'メールアドレスかパスワードが正しくありません';
const GENERIC = 'うまくいきませんでした。時間をおいてお試しください';

/* 上の理由で、アカウントの状態に関わるコードはすべて同じ文に畳む */
const HIDDEN = new Set([
	'INVALID_EMAIL_OR_PASSWORD',
	'INVALID_PASSWORD',
	'USER_NOT_FOUND',
	'EMAIL_NOT_VERIFIED',
	'USER_ALREADY_EXISTS',
	'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
	'CREDENTIAL_ACCOUNT_NOT_FOUND',
	'ACCOUNT_NOT_FOUND'
]);

/* 誰が見ても同じ結果になるもの。入力の直し方が分かるように、そのまま伝える */
const MESSAGES: Record<string, string> = {
	INVALID_EMAIL: 'メールアドレスの形式が正しくありません',
	PASSWORD_TOO_SHORT: `パスワードは${PASSWORD_MIN_LENGTH}文字以上にしてください`,
	PASSWORD_TOO_LONG: 'パスワードが長すぎます',
	INVALID_TOKEN: 'リンクが正しくありません。もう一度お試しください',
	TOKEN_EXPIRED: 'リンクの期限が切れています。もう一度お試しください'
};

/** Better Auth が返すコードを画面に出す文にする */
export function errorMessage(code: string | undefined | null): string {
	if (!code) return GENERIC;
	if (HIDDEN.has(code)) return UNAUTHORIZED;
	return MESSAGES[code] ?? GENERIC;
}

/** サーバまで届かなかったとき。応答が無いのでコードも無い */
export const OFFLINE_MESSAGE = '通信できませんでした。電波の届くところでお試しください';

/**
 * ログインした後に戻る先。
 * 別のサイトへ送られないよう、自分のサイトの絶対パスだけを通す
 */
export function safeRedirect(value: string | null): string {
	// 「//」で始まるものは別のサイトを指す
	if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
	return value;
}
