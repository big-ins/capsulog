import type { MonthGroup } from './types';

/**
 * 読み進めた分を後ろに繋ぐ。
 * 境目が同じ月なら1つの箱にまとめ、月の見出しが二重に出ないようにする
 */
export function appendGroups(base: MonthGroup[], incoming: MonthGroup[]): MonthGroup[] {
	const merged = base.map((group) => ({ ...group, items: [...group.items] }));
	for (const group of incoming) {
		const last = merged.at(-1);
		if (last && last.yearMonth === group.yearMonth && last.heading === group.heading) {
			last.items.push(...group.items);
		} else {
			merged.push({ ...group, items: [...group.items] });
		}
	}
	return merged;
}
