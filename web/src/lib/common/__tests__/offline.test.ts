import { describe, expect, it } from 'vitest';
import { keepsPage } from '../offline';

describe('keepsPage', () => {
	it('商品を探す画面を控える', () => {
		expect(keepsPage('/')).toBe(true);
		expect(keepsPage('/calendar')).toBe(true);
		expect(keepsPage('/products/123')).toBe(true);
	});

	it('画面の後ろに付いて届くデータも控える', () => {
		expect(keepsPage('/__data.json')).toBe(true);
		expect(keepsPage('/calendar/__data.json')).toBe(true);
		expect(keepsPage('/products/123/__data.json')).toBe(true);
	});

	it('ログインの画面・マイページ・受け口は控えない', () => {
		expect(keepsPage('/auth')).toBe(false);
		expect(keepsPage('/mypage')).toBe(false);
		expect(keepsPage('/mypage/__data.json')).toBe(false);
		expect(keepsPage('/push')).toBe(false);
		expect(keepsPage('/api/auth/callback/google')).toBe(false);
	});

	it('名前が似ているだけの画面は控えない', () => {
		expect(keepsPage('/calendar-old')).toBe(false);
		expect(keepsPage('/productsx')).toBe(false);
	});
});
