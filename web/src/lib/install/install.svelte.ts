import { installKind, type Device } from './platform';

/* Chrome 系だけが持つイベント。標準の型定義に入っていない */
interface BeforeInstallPromptEvent extends Event {
	prompt(): Promise<void>;
}

class InstallState {
	#device = $state<Omit<Device, 'canPrompt'> | null>(null);
	#deferred = $state<BeforeInstallPromptEvent | null>(null);
	#installed = $state(false);

	/** いまの案内の種類。サーバと、受け取り始める前は null */
	kind = $derived.by(() => {
		if (!this.#device || this.#installed) return null;
		return installKind({ ...this.#device, canPrompt: this.#deferred !== null });
	});

	/**
	 * ブラウザからの知らせを受け取り始める。止めるための関数を返す。
	 * インストール画面を呼ぶためのイベントは、ページを開いてすぐ届く。
	 * 案内を出す画面ではなくレイアウトで呼ぶ
	 */
	listen(): () => void {
		this.#device = {
			standalone: isStandalone(),
			userAgent: navigator.userAgent,
			maxTouchPoints: navigator.maxTouchPoints
		};

		const keep = (event: Event) => {
			// 止めないと、Android は画面下に独自の帯を出す。案内が二重になる
			event.preventDefault();
			this.#deferred = event as BeforeInstallPromptEvent;
		};
		// 追加しても、いま開いているタブはブラウザのまま。案内だけ消す
		const done = () => {
			this.#deferred = null;
			this.#installed = true;
		};

		addEventListener('beforeinstallprompt', keep);
		addEventListener('appinstalled', done);
		return () => {
			removeEventListener('beforeinstallprompt', keep);
			removeEventListener('appinstalled', done);
		};
	}

	/** ブラウザのインストール画面を出す。一度呼ぶと、同じイベントからは二度と出せない */
	async prompt(): Promise<void> {
		const event = this.#deferred;
		if (!event) return;
		this.#deferred = null;
		await event.prompt();
	}
}

/* iOS の古い版は display-mode に応えず、navigator.standalone だけを持つ */
function isStandalone(): boolean {
	return (
		matchMedia('(display-mode: standalone)').matches ||
		('standalone' in navigator && navigator.standalone === true)
	);
}

export const install = new InstallState();
