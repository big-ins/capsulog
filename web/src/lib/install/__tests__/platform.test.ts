import { describe, expect, it } from 'vitest';
import { installKind, type Device } from '../platform';

const UA = {
	iphoneSafari:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
	iphoneChrome:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/138.0.7204.119 Mobile/15E148 Safari/604.1',
	iphoneLine:
		'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Safari Line/15.9.0',
	ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
	android:
		'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36'
};

function device(userAgent: string, rest: Partial<Device> = {}): Device {
	return { standalone: false, canPrompt: false, userAgent, maxTouchPoints: 5, ...rest };
}

describe('installKind', () => {
	it('ホーム画面から開いていれば案内しない', () => {
		expect(installKind(device(UA.iphoneSafari, { standalone: true }))).toBeNull();
		expect(installKind(device(UA.android, { standalone: true, canPrompt: true }))).toBeNull();
	});

	it('インストール画面を呼べるなら、それを出す', () => {
		expect(installKind(device(UA.android, { canPrompt: true }))).toBe('prompt');
	});

	it('iPhone の Safari には手順を見せる', () => {
		expect(installKind(device(UA.iphoneSafari))).toBe('ios-safari');
	});

	it('iPhone の Safari 以外には Safari で開き直してもらう', () => {
		expect(installKind(device(UA.iphoneChrome))).toBe('ios-other');
		expect(installKind(device(UA.iphoneLine))).toBe('ios-other');
	});

	it('Mac を名乗る iPad も iOS として扱う', () => {
		expect(installKind(device(UA.ipad))).toBe('ios-safari');
	});

	it('触れない Mac は iOS として扱わない', () => {
		expect(installKind(device(UA.ipad, { maxTouchPoints: 0 }))).toBeNull();
	});

	it('インストール画面を呼べない iOS 以外は案内しない', () => {
		expect(installKind(device(UA.android))).toBeNull();
	});
});
