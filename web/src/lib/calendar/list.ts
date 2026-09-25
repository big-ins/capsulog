import { releaseHighlight, releaseStatus } from './format';
import type { MonthGroup, ProductListItem } from './types';

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

/** 並び順を指定していない状態。選択中の表示に使うだけで、URL には載らない */
export const UNSORTED = 'unsorted';

/*
 * 発売の近さ。小さいほど上に出る。
 * 断定できるものを先に見せ、済んだものを最後にする。
 * 月までしか分からない商品は、発売期間中かもしれないが断定できないため間に置く
 */
function releaseRank(item: ProductListItem): number {
	const highlight = releaseHighlight(item.yearMonth, item.precision, item.detail);
	if (highlight === '発売期間中！') return 0;
	if (highlight === 'まもなく') return 1;
	if (releaseStatus(item.yearMonth, item.precision, item.detail) === '発売済み') return 3;
	return 2;
}

/**
 * 発売が近い順に並べ直す。発売期間中を先頭に、発売済みを最後に回す。
 *
 * 既定は今月を旬の早い順で出すため、月の半ばでは発売済みが先頭に来る。
 * カレンダーを開くのは次に出るものを見るためで、もう並んでいるものが上にあると逆になる。
 *
 * 近さが同じものの中では元の並びを保つ。旬の早い順がそのまま残る
 */
export function byReleaseNearness(groups: MonthGroup[]): MonthGroup[] {
	return groups.map((group) => ({
		...group,
		items: group.items
			.map((item, index) => ({ item, index }))
			.sort((a, b) => releaseRank(a.item) - releaseRank(b.item) || a.index - b.index)
			.map(({ item }) => item)
	}));
}
