import { describe, expect, it } from 'vitest';
import { capsuleColorAt } from '../capsule';

describe('capsuleColorAt', () => {
	it('同じ商品の同じ位置なら、何度呼んでも同じ色になる', () => {
		expect(capsuleColorAt(42, 3)).toBe(capsuleColorAt(42, 3));
	});

	it('隣り合う位置は違う色になる', () => {
		expect(capsuleColorAt(42, 0)).not.toBe(capsuleColorAt(42, 1));
	});

	it('商品が違えば、同じ位置でも並びがずれる', () => {
		expect(capsuleColorAt(1, 0)).not.toBe(capsuleColorAt(2, 0));
	});

	it('色は6色で一巡する', () => {
		expect(capsuleColorAt(0, 6)).toBe(capsuleColorAt(0, 0));
		expect(capsuleColorAt(0, 7)).toBe(capsuleColorAt(0, 1));
	});

	it('全何種が多くても色を返す', () => {
		expect(capsuleColorAt(7, 29)).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('id が大きくても色を返す', () => {
		expect(capsuleColorAt(999999, 0)).toMatch(/^#[0-9a-f]{6}$/);
	});

	it('一巡の中に同じ色が出ない', () => {
		const colors = Array.from({ length: 6 }, (_, index) => capsuleColorAt(5, index));
		expect(new Set(colors).size).toBe(6);
	});
});
