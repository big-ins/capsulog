import { describe, expect, it } from 'vitest';
import { appendGroups } from '../list';
import type { MonthGroup, ProductListItem } from '../types';

function item(name: string): ProductListItem {
	return {
		id: name.length,
		name,
		price: 300,
		yearMonth: '2026-09',
		precision: 'month',
		detail: null,
		totalVariants: 5,
		officialUrl: 'https://example.com',
		makerCode: 'kitan',
		makerName: '奇譚クラブ'
	};
}

function group(
	yearMonth: string | null,
	names: string[],
	rest: Partial<MonthGroup> = {}
): MonthGroup {
	return { yearMonth, items: names.map(item), ...rest };
}

/** 月ごとに何が入っているかだけを見る */
function shape(groups: MonthGroup[]): [string | null, string[]][] {
	return groups.map((g) => [g.yearMonth, g.items.map((i) => i.name)]);
}

describe('appendGroups', () => {
	it('境目が同じ月なら1つの箱にまとめる', () => {
		const result = appendGroups([group('2026-09', ['a'])], [group('2026-09', ['b'])]);
		expect(shape(result)).toEqual([['2026-09', ['a', 'b']]]);
	});

	it('違う月は別の箱として後ろに足す', () => {
		const result = appendGroups([group('2026-09', ['a'])], [group('2026-10', ['b'])]);
		expect(shape(result)).toEqual([
			['2026-09', ['a']],
			['2026-10', ['b']]
		]);
	});

	it('見出しが違えば同じ月でもまとめない', () => {
		const result = appendGroups(
			[group('2026-09', ['a'], { heading: '〜300円' })],
			[group('2026-09', ['b'], { heading: '500円〜' })]
		);
		expect(shape(result)).toEqual([
			['2026-09', ['a']],
			['2026-09', ['b']]
		]);
	});

	it('まとめるのは境目だけ。離れた同じ月は別の箱のまま', () => {
		const result = appendGroups(
			[group('2026-09', ['a']), group('2026-10', ['b'])],
			[group('2026-09', ['c'])]
		);
		expect(shape(result)).toEqual([
			['2026-09', ['a']],
			['2026-10', ['b']],
			['2026-09', ['c']]
		]);
	});

	it('発売月不明どうしもまとめる', () => {
		const result = appendGroups([group(null, ['a'])], [group(null, ['b'])]);
		expect(shape(result)).toEqual([[null, ['a', 'b']]]);
	});

	it('続きが空なら元のまま', () => {
		const result = appendGroups([group('2026-09', ['a'])], []);
		expect(shape(result)).toEqual([['2026-09', ['a']]]);
	});

	it('元が空なら続きがそのまま並ぶ', () => {
		const result = appendGroups([], [group('2026-09', ['a'])]);
		expect(shape(result)).toEqual([['2026-09', ['a']]]);
	});

	it('まとめた箱の総数は元の月のものを保つ', () => {
		const result = appendGroups(
			[group('2026-09', ['a'], { count: 40 })],
			[group('2026-09', ['b'], { count: 40 })]
		);
		expect(result.map((g) => g.count)).toEqual([40]);
	});

	it('渡した配列を書き換えない', () => {
		const base = [group('2026-09', ['a'])];
		appendGroups(base, [group('2026-09', ['b'])]);
		expect(shape(base)).toEqual([['2026-09', ['a']]]);
	});
});
