import { describe, expect, it } from 'vitest';
import { signInSchema, signUpSchema } from '../schemas';
import { parseForm } from '$lib/common/form';

describe('signInSchema', () => {
	it('形式が正しければ通る', () => {
		const result = parseForm(signInSchema, { email: 'a@example.com', password: 'password1' });
		expect(result.ok).toBe(true);
	});

	it('項目ごとにエラーを返す', () => {
		const result = parseForm(signInSchema, { email: 'bad', password: 'short' });
		expect(result.ok).toBe(false);
		expect(result.errors.email).toBeDefined();
		expect(result.errors.password).toBeDefined();
	});

	it('パスワードの下限は8文字', () => {
		expect(parseForm(signInSchema, { email: 'a@example.com', password: '1234567' }).ok).toBe(false);
		expect(parseForm(signInSchema, { email: 'a@example.com', password: '12345678' }).ok).toBe(true);
	});
});

describe('signUpSchema', () => {
	it('ニックネームの前後の空白は落とす', () => {
		const result = parseForm(signUpSchema, {
			name: '  ひつじ  ',
			email: 'a@example.com',
			password: 'password1'
		});
		expect(result.ok).toBe(true);
		expect(result.value?.name).toBe('ひつじ');
	});

	it('空白だけのニックネームは通さない', () => {
		const result = parseForm(signUpSchema, {
			name: '   ',
			email: 'a@example.com',
			password: 'password1'
		});
		expect(result.ok).toBe(false);
		expect(result.errors.name).toBeDefined();
	});

	it('ニックネームの上限は30文字', () => {
		const base = { email: 'a@example.com', password: 'password1' };
		expect(parseForm(signUpSchema, { ...base, name: 'あ'.repeat(30) }).ok).toBe(true);
		expect(parseForm(signUpSchema, { ...base, name: 'あ'.repeat(31) }).ok).toBe(false);
	});
});
