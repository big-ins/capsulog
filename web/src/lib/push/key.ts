/**
 * base64url の公開鍵をバイト列にする。
 * pushManager.subscribe() は文字列も受け取るが、Safari はバイト列しか受け取らない
 */
export function decodeKey(base64url: string): Uint8Array<ArrayBuffer> {
	const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
	const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
	return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}
