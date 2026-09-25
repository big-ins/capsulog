/**
 * ホーム画面への追加をどう案内するか。
 *
 * - prompt: ブラウザのインストール画面を呼べる。Android と PC の Chrome 系
 * - ios-safari: 共有メニューから手で追加してもらう
 * - ios-other: Safari 以外で開いている。Safari で開き直してもらう
 */
export type InstallKind = 'prompt' | 'ios-safari' | 'ios-other';

export type Device = {
	/** ホーム画面から開いているか */
	standalone: boolean;
	/** ブラウザのインストール画面を呼べるか */
	canPrompt: boolean;
	userAgent: string;
	maxTouchPoints: number;
};

/*
 * iOS では Safari とそれ以外を機能の有無で見分けられない。
 * どれも中身は同じ WebKit で、違いは UA にしか出ない。
 * LINE や Instagram の中で開いたリンクもここに入る
 */
const IOS_OTHER = /CriOS|FxiOS|EdgiOS|Line\/|Instagram|FBA[NV]/;

/** 案内の種類を決める。案内しようがないときは null */
export function installKind(device: Device): InstallKind | null {
	if (device.standalone) return null;
	if (device.canPrompt) return 'prompt';
	if (!isIos(device)) return null;
	return IOS_OTHER.test(device.userAgent) ? 'ios-other' : 'ios-safari';
}

/* iPad は Mac の UA を名乗る。触れる画面かどうかで区別する */
function isIos({ userAgent, maxTouchPoints }: Device): boolean {
	return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
}
