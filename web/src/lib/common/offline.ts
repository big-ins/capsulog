/*
 * 通信が切れたときに出す画面の控え。Service Worker が書き、ページが消す。
 * 名前に版を含める。前の版の画面は前の版の JS を指していて、控えから出しても動かない
 */
const PAGE_CACHE_PREFIX = 'capsulog-pages-';

export function pageCacheName(version: string): string {
	return PAGE_CACHE_PREFIX + version;
}

/**
 * 控える画面か。通信が切れても見たいのは、商品を探す画面だけ。
 * ログインの画面・マイページ・書き込みの受け口は控えない。
 * 画面のデータは「/calendar/__data.json」のように画面の後ろに付いて届く
 */
export function keepsPage(pathname: string): boolean {
	const page = pathname.replace(/\/__data\.json$/, '') || '/';
	return page === '/' || page === '/calendar' || page.startsWith('/products/');
}

/**
 * 画面の控えを捨てる。控えた画面には、ログインしていた人の情報が入っている。
 * 共有の端末で、前の人の画面が控えから出てこないようにする
 */
export async function clearPageCache(): Promise<void> {
	if (typeof caches === 'undefined') return;
	const keys = await caches.keys();
	await Promise.all(
		keys.filter((key) => key.startsWith(PAGE_CACHE_PREFIX)).map((key) => caches.delete(key))
	);
}
