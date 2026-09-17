/* カプセルの配色。商品 id を種にして商品ごとに固定の並びになる */

const COLORS = ['#f2766b', '#64bfae', '#8a92e3', '#e8a94f', '#e884b8', '#7cc0e8'];

export function capsuleColorAt(seed: number, index: number): string {
	// seed は商品 id、index は並びの位置。どちらも 0 以上で、剰余は範囲に収まる
	return COLORS[(seed + index) % COLORS.length]!;
}
