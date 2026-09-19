import { describe, expect, it } from 'vitest';
import { authMode, errorMessage, safeRedirect } from '../form';

describe('errorMessage', () => {
	const hidden = [
		'INVALID_EMAIL_OR_PASSWORD',
		'INVALID_PASSWORD',
		'USER_NOT_FOUND',
		'EMAIL_NOT_VERIFIED',
		'USER_ALREADY_EXISTS',
		'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
		'CREDENTIAL_ACCOUNT_NOT_FOUND',
		'ACCOUNT_NOT_FOUND'
	];

	it('アカウントの状態が分かるコードはすべて同じ文になる', () => {
		const messages = new Set(hidden.map(errorMessage));
		expect(messages.size).toBe(1);
	});

	it('畳んだ文はアカウントの有無に触れない', () => {
		for (const code of hidden) {
			expect(errorMessage(code)).toBe('メールアドレスかパスワードが正しくありません');
		}
	});

	it('入力の直し方が分かるものはそのまま伝える', () => {
		expect(errorMessage('PASSWORD_TOO_SHORT')).toContain('8文字以上');
		expect(errorMessage('TOKEN_EXPIRED')).toContain('期限');
	});

	it('知らないコードと空は汎用の文になる', () => {
		expect(errorMessage('WHAT_IS_THIS')).toBe('うまくいきませんでした。時間をおいてお試しください');
		expect(errorMessage(undefined)).toBe('うまくいきませんでした。時間をおいてお試しください');
	});
});

describe('safeRedirect', () => {
	it('自分のサイトの絶対パスは通す', () => {
		expect(safeRedirect('/shelf')).toBe('/shelf');
		expect(safeRedirect('/products/12?back=a')).toBe('/products/12?back=a');
	});

	it('別のサイトへは送らない', () => {
		expect(safeRedirect('//evil.example.com')).toBe('/');
		expect(safeRedirect('https://evil.example.com')).toBe('/');
		expect(safeRedirect('shelf')).toBe('/');
	});

	it('空と null は先頭に戻す', () => {
		expect(safeRedirect(null)).toBe('/');
		expect(safeRedirect('')).toBe('/');
	});
});

describe('authMode', () => {
	it('知っている値はそのまま通す', () => {
		expect(authMode('login')).toBe('login');
		expect(authMode('signup')).toBe('signup');
		expect(authMode('reset')).toBe('reset');
	});

	it('知らない値と null はログインになる', () => {
		expect(authMode('shelf')).toBe('login');
		expect(authMode('')).toBe('login');
		expect(authMode(null)).toBe('login');
	});
});
