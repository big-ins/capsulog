/// <reference types="@sveltejs/kit" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';
import { keepsPage, pageCacheName } from '$lib/common/offline';
import { readMessage } from '$lib/push/message';

// 既定の self は Window として解決される。worker の型に絞る
const worker = self as unknown as ServiceWorkerGlobalScope;

/*
 * 名前にビルドの版を含める。古い版のキャッシュは activate で捨てる。
 * build は JS と CSS、files は static の中身
 */
const CACHE = `capsulog-${version}`;

/* 画面の控えは別の入れ物に入れる。ログインした人の情報が入るので、ページが丸ごと捨てる */
const PAGES = pageCacheName(version);

/*
 * 名前に版が入り、中身が変わらないもの。一度取れば以後は取りに行かない。
 * 丸ゴシックの日本語サブセットは 700 を超え、切り抜きの WASM は 1 つで 23MB ある。
 * 先に全部取ると初回が重すぎるため、使われたものだけ後から控える
 */
const DEFERRED = /\.(woff2?|ttf|otf|wasm)$/;

/** 先に取っておくもの。重いものは含めない */
const PRECACHED = new Set([...build, ...files].filter((path) => !DEFERRED.test(path)));

/** 控えてよいか。中身が変わらないものだけを対象にする */
function immutable(pathname: string): boolean {
	return PRECACHED.has(pathname) || DEFERRED.test(pathname);
}

worker.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll([...PRECACHED]))
			// 新しい版をすぐ使う。古い worker が閉じるのを待たない
			.then(() => worker.skipWaiting())
	);
});

worker.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((key) => key !== CACHE && key !== PAGES).map((key) => caches.delete(key))
				)
			)
			// 開いているページを新しい worker の管理下へ移す
			.then(() => worker.clients.claim())
	);
});

/*
 * 取り方を分ける。
 *
 * ビルド成果物はファイル名に版が入るので、キャッシュを先に見てよい。
 * 商品を探す画面は毎回取りに行き、繋がらないときだけ前回の応答を返す。
 * こちらでキャッシュを先に見ると、発売情報が古いまま出る。
 * それ以外は触らない。ログインの行き来やマイページを控えから出すと、別の人の画面が出うる
 */
worker.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== location.origin) return;

	// 中身が変わらないものは、取りに行かずキャッシュから返す
	if (immutable(url.pathname)) {
		event.respondWith(fromCache(request));
		return;
	}

	if (keepsPage(url.pathname)) event.respondWith(fetchAndKeep(request));
});

/** キャッシュにあればそれを返す。無ければ取りに行き、控えてから返す */
async function fromCache(request: Request): Promise<Response> {
	const hit = await caches.match(request);
	if (hit) return hit;

	const response = await fetch(request);
	if (response.status === 200) {
		const cache = await caches.open(CACHE);
		cache.put(request, response.clone());
	}
	return response;
}

/** 取りに行き、取れたら控える。繋がらなければ前回の応答を返す */
async function fetchAndKeep(request: Request): Promise<Response> {
	try {
		const response = await fetch(request);
		// 206 などの部分応答は Cache API が受け取らない
		if (response.status === 200) {
			const cache = await caches.open(PAGES);
			cache.put(request, response.clone());
		}
		return response;
	} catch (error) {
		const hit = await caches.match(request, { cacheName: PAGES });
		if (hit) return hit;
		throw error;
	}
}

/*
 * 届いたら必ず通知を出す。出さないと、ブラウザは代わりの通知を出すか、
 * 通知を出さないサイトとして購読を止める。本文が読めないときも出す
 */
worker.addEventListener('push', (event) => {
	const message = readMessage(() => event.data?.json());
	event.waitUntil(
		worker.registration.showNotification(message.title, {
			body: message.body,
			icon: '/icon-192.png',
			lang: 'ja',
			data: { url: message.url }
		})
	);
});

/*
 * タップしたら行き先を開く。カプセログが開いていればそのタブに移る。
 * 同じアプリが二つ開くと、どちらを見ていたか分からなくなる
 */
worker.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const url = new URL(event.notification.data?.url ?? '/', location.origin).href;
	event.waitUntil(openOrFocus(url));
});

async function openOrFocus(url: string): Promise<void> {
	const windows = await worker.clients.matchAll({ type: 'window', includeUncontrolled: true });
	const open = windows.find((client) => new URL(client.url).origin === location.origin);
	if (open) {
		try {
			await open.focus();
			await open.navigate(url);
			return;
		} catch {
			// 管理下にないタブは移れない。新しく開く
		}
	}
	await worker.clients.openWindow(url);
}

/* 標準の型定義に入っていない。Chrome と Firefox が送る */
interface PushSubscriptionChangeEvent extends ExtendableEvent {
	readonly oldSubscription: PushSubscription | null;
	readonly newSubscription: PushSubscription | null;
}

/*
 * ブラウザが宛先を作り直したら、新しい宛先をサーバへ送る。
 * 送らないと、サーバには古い宛先だけが残り、この端末に黙って届かなくなる。
 * 古い宛先は、送信バッチが送って 410 を受けたときに消える
 */
worker.addEventListener('pushsubscriptionchange', (event) => {
	const change = event as PushSubscriptionChangeEvent;
	change.waitUntil(resubscribe(change));
});

async function resubscribe(event: PushSubscriptionChangeEvent): Promise<void> {
	// 新しい宛先を渡さないブラウザもある。前の宛先と同じ鍵で作り直す
	const key = event.oldSubscription?.options.applicationServerKey;
	const subscription =
		event.newSubscription ??
		(key
			? await worker.registration.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: key
				})
			: null);
	if (!subscription) return;

	// Cookie が付くので、ログインしている人の宛先として保存される。
	// ログアウトしていれば 401 になるが、送る相手がいないので構わない
	await fetch('/push', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(subscription.toJSON())
	});
}
