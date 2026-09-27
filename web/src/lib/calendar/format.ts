const PERIOD_LABELS: Record<string, string> = { early: '上旬', mid: '中旬', late: '下旬' };

/** '2026-10' を「2026年10月」にする。null は「発売月不明」 */
export function formatYearMonth(yearMonth: string | null): string {
	if (!yearMonth) return '発売月不明';
	const [year, month] = yearMonth.split('-');
	return `${year}年${Number(month)}月`;
}

/** 粒度の付加情報を短く表す。旬は「上旬」、週は「10/6週」。月までなら null */
export function formatDetail(precision: string | null, detail: string | null): string | null {
	if (!detail) return null;
	if (precision === 'period') return PERIOD_LABELS[detail] ?? null;
	if (precision === 'week') {
		const [month, day] = detail.split('-');
		return `${Number(month)}/${Number(day)}週`;
	}
	return null;
}

/** 発売時期の全体表記。「2026年10月上旬」「2026年6月 6/15週」など */
export function formatRelease(
	yearMonth: string | null,
	precision: string | null,
	detail: string | null
): string {
	const base = formatYearMonth(yearMonth);
	const suffix = formatDetail(precision, detail);
	if (!suffix) return base;
	// 週は日付が続いて読めるため、区切りを入れる
	return precision === 'week' ? `${base} ${suffix}` : base + suffix;
}

/**
 * 年を省いた発売時期。「9月中旬」「9/21週」「9月」。年が分かりきった場所で使う。
 * 週は日付に月を含むので、月を重ねない
 */
export function formatReleaseInYear(
	yearMonth: string,
	precision: string | null,
	detail: string | null
): string {
	const suffix = formatDetail(precision, detail);
	if (precision === 'week' && suffix) return suffix;
	return `${Number(yearMonth.slice(5, 7))}月${suffix ?? ''}`;
}

/* 旬・週が今月の何日目までかかるか。発売済みの判定にだけ使う */
function segmentEndDay(precision: string | null, detail: string | null): number {
	if (precision === 'period' && detail) return { early: 10, mid: 20, late: 31 }[detail] ?? 31;
	if (precision === 'week' && detail) return Number(detail.split('-')[1]) + 6;
	return 31;
}

/** 発売の状況を短く言う。「発売済み」「今月発売」「来月発売」「発売まであと約3ヶ月」。不明は null */
export function releaseStatus(
	yearMonth: string | null,
	precision: string | null,
	detail: string | null
): string | null {
	if (!yearMonth) return null;
	const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
	const current = `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, '0')}`;
	if (yearMonth < current) return '発売済み';
	if (yearMonth > current) {
		const [year, month] = yearMonth.split('-').map(Number);
		const monthsAhead =
			((year ?? 0) - jst.getUTCFullYear()) * 12 + ((month ?? 0) - (jst.getUTCMonth() + 1));
		return monthsAhead === 1 ? '来月発売' : `発売まであと約${monthsAhead}ヶ月`;
	}
	return jst.getUTCDate() > segmentEndDay(precision, detail) ? '発売済み' : '今月発売';
}

/* 旬・週が今月の何日目から始まるか。発売の近さの判定に使う */
function segmentStartDay(precision: string | null, detail: string | null): number {
	if (precision === 'period' && detail) return { early: 1, mid: 11, late: 21 }[detail] ?? 1;
	if (precision === 'week' && detail) return Number(detail.split('-')[1]);
	return 1;
}

/**
 * 一覧で目を引かせる印。「発売期間中」「まもなく」だけを返し、そうでなければ null
 *
 * 月までしか分からない商品には出さない。月内のいつかを断定できず、
 * 出すと今月の全商品に付いて強弱にならない。
 */
export function releaseHighlight(
	yearMonth: string | null,
	precision: string | null,
	detail: string | null
): '発売期間中！' | 'まもなく' | null {
	if (!yearMonth || !detail) return null;
	if (precision !== 'period' && precision !== 'week') return null;
	const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
	const current = `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, '0')}`;
	if (yearMonth !== current) return null;

	const today = jst.getUTCDate();
	const start = segmentStartDay(precision, detail);
	const end = segmentEndDay(precision, detail);
	// 期間に入っていれば発売期間中。手前1週間はまもなく
	if (today >= start && today <= end) return '発売期間中！';
	return start - today <= 7 && start > today ? 'まもなく' : null;
}

/**
 * 一覧で発売済みと示すか。今月のものだけ。
 *
 * 過去の月は見出しで分かる。全件に付いて強弱が死ぬため出さない。
 * 今月は旬・週が過ぎたものと、まだのものが混ざる。ここだけは印がないと見分けられない。
 *
 * 月までしか分からない商品には出ない。月内のいつ出るか断定できないため、
 * 印の有無が「発売済み」と「判断できない」の区別を兼ねる
 */
export function showsSoldOut(
	yearMonth: string | null,
	precision: string | null,
	detail: string | null
): boolean {
	if (yearMonth !== currentYearMonth()) return false;
	return releaseStatus(yearMonth, precision, detail) === '発売済み';
}

/**
 * リマインドを付けられるか。発売期間が終わっていないもの。
 *
 * 発売済みは知らせる先が過ぎている。発売月不明はいつ知らせるかが決まらない。
 * 期間中は付けられるが、通知は届かない。期間の間はホームに並ぶ
 */
export function canRemind(
	yearMonth: string | null,
	precision: string | null,
	detail: string | null
): boolean {
	if (!yearMonth) return false;
	return releaseStatus(yearMonth, precision, detail) !== '発売済み';
}

/**
 * いま発売期間の中にいるか。月までしか分からないものは、その月の間ずっと中にいる。
 *
 * 通知のバッチと区切りを揃える。ずれると、付けたときの案内と届く通知が食い違う
 */
export function inReleasePeriod(
	yearMonth: string | null,
	precision: string | null,
	detail: string | null
): boolean {
	if (!yearMonth || yearMonth !== currentYearMonth()) return false;
	const today = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCDate();
	return today >= segmentStartDay(precision, detail) && today <= segmentEndDay(precision, detail);
}

/** 今日から offsetMonths ヶ月後の 'YYYY-MM'。日本時間で数える */
export function currentYearMonth(offsetMonths = 0): string {
	const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
	return fromMonthCount(jst.getUTCFullYear() * 12 + jst.getUTCMonth() + offsetMonths);
}

/** 'YYYY-MM' を前後にずらす。年をまたぐ計算はここに閉じる */
export function shiftYearMonth(yearMonth: string, offsetMonths: number): string {
	const year = Number(yearMonth.slice(0, 4));
	const month = Number(yearMonth.slice(5, 7));
	return fromMonthCount(year * 12 + (month - 1) + offsetMonths);
}

/** 西暦0年1月からの月数を 'YYYY-MM' に戻す */
function fromMonthCount(total: number): string {
	const year = Math.floor(total / 12);
	const month = (total % 12) + 1;
	return `${year}-${String(month).padStart(2, '0')}`;
}
