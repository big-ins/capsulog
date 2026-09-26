import { decodeKey } from './key';

/**
 * この端末の通知の状態。
 *
 * - unsupported: 通知が使えない。iPhone でホーム画面に追加していないときもここ
 * - default: まだ聞いていない
 * - granted: 許可されている
 * - denied: OS かブラウザで止められている。ページからは聞き直せない
 */
export type PushStatus = 'unsupported' | NotificationPermission;

class PushState {
	/** サーバと、確かめる前は null */
	status = $state<PushStatus | null>(null);
	/** この端末の宛先がサーバに届いているか */
	subscribed = $state(false);

	/**
	 * 今の状態を読み、宛先があればサーバへ送り直す。
	 * 送り直すのは、前回の登録が通信で落ちていても、次に開いたときに揃うようにするため。
	 * 同じ端末で別の人がログインしたときも、ここで持ち主が付け替わる
	 */
	async sync(loggedIn: boolean): Promise<void> {
		if (!supported()) {
			this.status = 'unsupported';
			return;
		}
		this.status = Notification.permission;
		const subscription = await current();
		this.subscribed = subscription !== null && this.status === 'granted';
		if (this.subscribed && loggedIn) await send('POST', subscription!.toJSON());
	}

	/**
	 * OS のダイアログで許可を求め、許可されたら宛先を登録する。許可されたかを返す。
	 * iOS は押した操作の中でしかダイアログを出さない。押した直後に呼ぶ
	 */
	async subscribe(publicKey: string): Promise<boolean> {
		this.status = await Notification.requestPermission();
		if (this.status !== 'granted') return false;

		const registration = await navigator.serviceWorker.ready;
		const key = decodeKey(publicKey);
		let subscription = await registration.pushManager.getSubscription();
		// 別の鍵で作った宛先は使い回せない。開発用と本番用の鍵を取り違えたときに起きる
		if (subscription && !sameKey(subscription.options.applicationServerKey, key)) {
			await subscription.unsubscribe();
			subscription = null;
		}
		subscription ??= await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: key
		});

		await send('POST', subscription.toJSON());
		this.subscribed = true;
		return true;
	}

	/** この端末の宛先を消す。OS の許可はそのまま残る */
	async unsubscribe(): Promise<void> {
		const subscription = await current();
		if (subscription) {
			// 先にサーバから消す。逆だと、サーバに消せない宛先が残る
			await send('DELETE', { endpoint: subscription.endpoint });
			await subscription.unsubscribe();
		}
		this.subscribed = false;
	}
}

function supported(): boolean {
	return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/* Service Worker が無いと ready は終わらない。dev サーバでも止まらないよう getRegistration を使う */
async function current(): Promise<PushSubscription | null> {
	const registration = await navigator.serviceWorker.getRegistration();
	return (await registration?.pushManager.getSubscription()) ?? null;
}

function sameKey(a: ArrayBuffer | null, b: Uint8Array): boolean {
	if (!a) return false;
	const bytes = new Uint8Array(a);
	return bytes.length === b.length && bytes.every((byte, index) => byte === b[index]);
}

async function send(method: 'POST' | 'DELETE', body: unknown): Promise<void> {
	const response = await fetch('/push', {
		method,
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body)
	});
	if (!response.ok) throw new Error(`宛先を送れなかった: ${response.status}`);
}

export const push = new PushState();
