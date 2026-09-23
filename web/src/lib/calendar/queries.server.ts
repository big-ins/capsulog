import type {
	Maker,
	MonthCount,
	MonthGroup,
	ProductDetail,
	ProductListItem,
	Variant,
	YearCount
} from './types';

export type ListFilters = {
	/** 絞り込む発売月。空配列は全期間 */
	yearMonths: string[];
	/** この月以降を出す。「再来月以降」用。yearMonths より優先 */
	fromYearMonth?: string;
	/** この月以前を出す。「先々月以前」用。新しい月から順に返す */
	untilYearMonth?: string;
	/** この年のものだけを出す。'YYYY'。過去を年で辿るときに使う */
	year?: string;
	/** true なら発売月不明だけを出す */
	unknownOnly?: boolean;
	makerCode?: string;
	priceBand?: '300' | '400' | '500';
	keyword?: string;
	/** 並び順。省略時は月の絞り込みに合わせて向きを決める */
	sort?: Sort;
	/** 何件返すか */
	limit?: number;
	/** 何件目から返すか。続きだけを取るときに使う */
	offset?: number;
	/** 見ている人。あればお気に入りとリマインドの状態を混ぜる */
	userId?: number;
	/** お気に入りだけに絞る。userId が無いときは効かない */
	favoritedOnly?: boolean;
};

export type Sort = 'release-asc' | 'release-desc' | 'price-asc' | 'price-desc';

/*
 * 1回で取る件数。スクロールで続きを足していく。
 * 既定表示は 20 件前後、年で辿っても月あたり 12 件ほど。
 * 大きくしても最初の1画面より下は読まれず、待ち時間だけ延びる。
 */
export const PAGE_SIZE = 60;

/* 読み進められる上限。URL に極端な limit や offset を渡されても、D1 を酷使させない */
export const MAX_LIMIT = 1200;

/*
 * 商品カードと商品詳細が必要とする列。
 * ログインしていれば自分の状態を混ぜ、していなければ結合せず 0 を置く。
 * 列の形は揃えるので、画面はログインの有無で分岐せずに読める。
 * userId を文字列に埋めず、返した SQL のプレースホルダへ先頭で bind する
 */
function selectItem(userId?: number): string {
	// まだ何も付けていない商品は結合先が無い。COALESCE で 0 に落とす
	const columns = userId
		? 'COALESCE(s.favorited, 0) AS favorited, COALESCE(s.remind, 0) AS remind'
		: '0 AS favorited, 0 AS remind';
	const join = userId
		? 'LEFT JOIN user_product_states s ON s.product_id = p.id AND s.user_id = ?'
		: '';
	return `
	SELECT p.id, p.name, p.price,
	       p.release_year_month AS yearMonth,
	       p.release_precision  AS precision,
	       p.release_detail     AS detail,
	       p.total_variants     AS totalVariants,
	       p.official_url       AS officialUrl,
	       m.code AS makerCode, m.name AS makerName,
	       ${columns}
	FROM products p JOIN makers m ON m.id = p.maker_id
	${join}
`;
}

/* 月の中の並び。旬は 上→中→下、週は日付を旬の位置に換算して混ぜる。月までの商品が先頭 */
const RELEASE_ORDER = `
	CASE p.release_precision
		WHEN 'period' THEN CASE p.release_detail WHEN 'early' THEN 1 WHEN 'mid' THEN 2 ELSE 3 END
		WHEN 'week'   THEN (CAST(substr(p.release_detail, 4, 2) AS INTEGER) + 9) / 10
		ELSE 0
	END
`;

function escapeLike(value: string): string {
	return value.replace(/[\\%_]/g, (character) => '\\' + character);
}

/** 商品を持つメーカーの一覧 */
export async function listMakers(db: D1Database): Promise<Maker[]> {
	const { results } = await db
		.prepare(
			`SELECT code, name FROM makers m
			 WHERE EXISTS (SELECT 1 FROM products p WHERE p.maker_id = m.id) ORDER BY m.id`
		)
		.all<Maker>();
	return results;
}

/** 絞り込み条件に合う商品を発売月ごとにまとめて返す */
export async function listProducts(
	db: D1Database,
	filters: ListFilters
): Promise<{ groups: MonthGroup[]; total: number; hasMore: boolean }> {
	const where: string[] = [];
	const binds: (string | number)[] = [];

	if (filters.unknownOnly) {
		where.push('p.release_year_month IS NULL');
	} else if (filters.year) {
		where.push('substr(p.release_year_month, 1, 4) = ?');
		binds.push(filters.year);
		// 年の一覧は先々月以前の件数で出している。押した先も同じ範囲に合わせる
		if (filters.untilYearMonth) {
			where.push('p.release_year_month <= ?');
			binds.push(filters.untilYearMonth);
		}
	} else if (filters.fromYearMonth) {
		where.push('p.release_year_month >= ?');
		binds.push(filters.fromYearMonth);
	} else if (filters.untilYearMonth) {
		where.push('p.release_year_month <= ?');
		binds.push(filters.untilYearMonth);
	} else if (filters.yearMonths.length > 0) {
		where.push(`p.release_year_month IN (${filters.yearMonths.map(() => '?').join(', ')})`);
		binds.push(...filters.yearMonths);
	}
	if (filters.makerCode) {
		where.push('m.code = ?');
		binds.push(filters.makerCode);
	}
	if (filters.priceBand === '300') where.push('p.price <= 300');
	if (filters.priceBand === '400') where.push('p.price BETWEEN 301 AND 499');
	if (filters.priceBand === '500') where.push('p.price >= 500');
	if (filters.keyword) {
		where.push(`p.name LIKE ? ESCAPE '\\'`);
		binds.push(`%${escapeLike(filters.keyword)}%`);
	}

	/*
	 * お気に入りだけに絞る。状態の行は LEFT JOIN で繋いであるので、値を見るだけでよい。
	 * 総数のクエリは JOIN を持たないため、そちらには別に足す
	 */
	const favoritedOnly = Boolean(filters.favoritedOnly && filters.userId);
	if (favoritedOnly) where.push('s.favorited = 1');

	// 指定が無ければ現在から遠ざかる向き。過去をさかのぼる表示だけ新しい月が先になる
	const goingBack = Boolean(filters.untilYearMonth || filters.year);
	const sort: Sort = filters.sort ?? (goingBack ? 'release-desc' : 'release-asc');
	const descending = sort.endsWith('-desc');
	const direction = descending ? 'DESC' : 'ASC';

	// 価格順は月を挟まない。月を先に見ると、月の中だけの価格順になって全体の高安が出ない
	const order = sort.startsWith('price')
		? `p.price IS NULL, p.price ${direction}, p.name`
		: // 月をまたぐ向きに月の中も揃える。新しい順なら下旬が先に来る
			`p.release_year_month ${direction}, ${RELEASE_ORDER} ${direction}, p.name`;
	// 続きを足していくため、並びが毎回同じでなければならない。同名の商品があるので id で決着させる
	const sql = `${selectItem(filters.userId)}
		${where.length ? 'WHERE ' + where.join(' AND ') : ''}
		ORDER BY p.release_year_month IS NULL, ${order}, p.id
		LIMIT ? OFFSET ?`;

	const limit = filters.limit ?? PAGE_SIZE;
	// userId は JOIN の中にあり、WHERE より前に出る。bind もその順に並べる
	const leading = filters.userId ? [filters.userId] : [];
	const { results } = await db
		.prepare(sql)
		.bind(...leading, ...binds, limit + 1, filters.offset ?? 0)
		.all<ProductListItem>();

	const hasMore = results.length > limit;
	const items = hasMore ? results.slice(0, limit) : results;

	/*
	 * 総数を別に数える。
	 * 読み込めた分だけで数えると、続きを読むたびに見出しの件数が増えていく。
	 */
	// 見出しに使う軸で数える。価格順なら価格ごと、そうでなければ月ごと
	const groupBy = sort.startsWith('price') ? 'p.price' : 'p.release_year_month';
	// 絞り込みが状態を見るときだけ、数える側にも同じ結合を足す
	const countJoin = favoritedOnly
		? 'LEFT JOIN user_product_states s ON s.product_id = p.id AND s.user_id = ?'
		: '';
	const { results: totals } = await db
		.prepare(
			`SELECT ${groupBy} AS key, count(*) AS count
			 FROM products p JOIN makers m ON m.id = p.maker_id
			 ${countJoin}
			 ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
			 GROUP BY ${groupBy}`
		)
		.bind(...(favoritedOnly ? [filters.userId as number] : []), ...binds)
		.all<{ key: string | number | null; count: number }>();
	const countOf = new Map(totals.map((row) => [row.key, row.count]));

	/*
	 * 価格順は価格で切る。実際に並ぶのは数種類なので、月と同じように見出しが立つ。
	 * 月で切ると価格順にならず、ひとまとめでは同じ価格が延々と続いて順序が見えない。
	 */
	if (sort.startsWith('price')) {
		const groups: MonthGroup[] = [];
		for (const item of items) {
			const heading = item.price === null ? '価格不明' : `¥${item.price}`;
			const last = groups.at(-1);
			if (last && last.heading === heading) last.items.push(item);
			else
				groups.push({
					yearMonth: null,
					items: [item],
					count: countOf.get(item.price) ?? 0,
					heading
				});
		}
		return { groups, total: items.length, hasMore };
	}

	const groups: MonthGroup[] = [];
	for (const item of items) {
		const last = groups.at(-1);
		if (last && last.yearMonth === item.yearMonth) last.items.push(item);
		else
			groups.push({
				yearMonth: item.yearMonth,
				items: [item],
				count: countOf.get(item.yearMonth) ?? 0
			});
	}
	return { groups, total: items.length, hasMore };
}

/**
 * 発売月を年ごとにまとめた件数。新しい年から順に返す
 *
 * 掲載は 200 ヶ月を超え、月をそのまま並べると一覧にならない。まず年を選ばせる。
 * 年の中は月で辿れるよう、月ごとの件数も添える。
 */
export async function listYearCounts(db: D1Database, thisYearMonth: string): Promise<YearCount[]> {
	const { results } = await db
		.prepare(
			`SELECT release_year_month AS yearMonth, count(*) AS count
			 FROM products
			 WHERE release_year_month IS NOT NULL
			 GROUP BY yearMonth ORDER BY yearMonth DESC`
		)
		.all<MonthCount>();
	if (results.length === 0) return [];

	const countOf = new Map(results.map((row) => [row.yearMonth, row.count]));
	const oldest = results.at(-1)!.yearMonth;
	const newest = results[0]!.yearMonth;
	const thisYear = thisYearMonth.slice(0, 4);

	const years: YearCount[] = [];
	for (let year = Number(newest.slice(0, 4)); year >= Number(oldest.slice(0, 4)); year--) {
		/*
		 * 今年までは 12 ヶ月を並べる。載っていない月が抜けて見えると、
		 * 集めていないのか商品が無いのかが分からない。
		 * 来年以降はまだ発表されていないだけなので、載っている月だけを出す。
		 */
		const fillsYear = String(year) <= thisYear;
		const months: MonthCount[] = [];
		for (let month = 12; month >= 1; month--) {
			const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
			// 掲載が始まる前の月は数に入れない。集めていない期間まで 0 件で並べない
			if (yearMonth < oldest || yearMonth > newest) continue;
			const count = countOf.get(yearMonth);
			if (count === undefined && !fillsYear) continue;
			months.push({ yearMonth, count: count ?? 0 });
		}
		if (months.length === 0) continue;
		years.push({
			year: String(year),
			count: months.reduce((sum, month) => sum + month.count, 0),
			months
		});
	}
	return years;
}

/** 件数のまとめ。ヒーローに出す数と、発売時期の一覧へ誘うための数 */
export async function countProducts(
	db: D1Database,
	yearMonth: string
): Promise<{
	thisMonth: number;
	total: number;
	unknown: number;
	oldestYear: string | null;
}> {
	const row = await db
		.prepare(
			`SELECT (SELECT count(*) FROM products WHERE release_year_month = ?) AS thisMonth,
			        (SELECT count(*) FROM products WHERE release_year_month IS NULL) AS unknown,
			        (SELECT substr(min(release_year_month), 1, 4) FROM products
			          WHERE release_year_month IS NOT NULL) AS oldestYear,
			        count(*) AS total
			 FROM products`
		)
		.bind(yearMonth)
		.first<{
			thisMonth: number;
			total: number;
			unknown: number;
			oldestYear: string | null;
		}>();
	return row ?? { thisMonth: 0, total: 0, unknown: 0, oldestYear: null };
}

/*
 * LIKE のパターンが長いと D1 が「pattern too complex」で落ちる。上限は 50 バイト。
 * 文字数で切ると絵文字などで超えるため、エスケープ後のバイト数で測る。
 */
const LIKE_PATTERN_MAX_BYTES = 48;

/** 末尾を削り、LIKE のパターンとして収まる長さにする */
export function fitToLikePattern(value: string): string {
	const encoder = new TextEncoder();
	let fitted = value;
	while (fitted && encoder.encode(escapeLike(fitted)).length > LIKE_PATTERN_MAX_BYTES) {
		fitted = [...fitted].slice(0, -1).join('');
	}
	return fitted;
}

/** シリーズ判定に使う商品名の頭。最初の語から末尾の数字を落とす */
function seriesPrefix(name: string): string | null {
	const token = name.split(/\s+/)[0] ?? '';
	const prefix = fitToLikePattern(token.replace(/[0-9０-９]+$/, ''));
	return prefix.length >= 2 ? prefix : null;
}

/** 名前の頭が同じ商品。シリーズの前作・続編を新しい順に返す */
export async function listSeriesProducts(
	db: D1Database,
	product: ProductListItem,
	userId?: number
): Promise<ProductListItem[]> {
	const prefix = seriesPrefix(product.name);
	if (!prefix) return [];
	const leading = userId ? [userId] : [];
	const { results } = await db
		.prepare(
			`${selectItem(userId)} WHERE p.id != ? AND p.name LIKE ? ESCAPE '\\'
			 ORDER BY p.release_year_month DESC LIMIT 6`
		)
		.bind(...leading, product.id, `${escapeLike(prefix)}%`)
		.all<ProductListItem>();
	return results;
}

/** 商品1件と、そのラインナップ */
export async function getProduct(
	db: D1Database,
	id: number,
	userId?: number
): Promise<ProductDetail | null> {
	const leading = userId ? [userId] : [];
	const product = await db
		.prepare(`${selectItem(userId)} WHERE p.id = ?`)
		.bind(...leading, id)
		.first<ProductListItem>();
	if (!product) return null;

	const { results: variants } = await db
		.prepare(
			`SELECT name, is_secret AS isSecret FROM variants
			 WHERE product_id = ? ORDER BY display_order`
		)
		.bind(id)
		.all<Variant>();
	return { ...product, variants };
}
