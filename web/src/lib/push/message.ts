/** 送信バッチが送ってくる本文 */
export type PushMessage = { title: string; body: string; url: string };

const FALLBACK: PushMessage = { title: 'カプセログ', body: '', url: '/' };

/**
 * 届いた本文を読む。読めなければ、サイト名だけの通知にする。
 * 行き先はサイトの中に限る。「//」で始まるものは別のサイトを指す
 */
export function readMessage(read: () => unknown): PushMessage {
	let value: Partial<PushMessage> | undefined;
	try {
		value = read() as Partial<PushMessage> | undefined;
	} catch {
		return FALLBACK;
	}
	if (typeof value?.title !== 'string' || typeof value.body !== 'string') return FALLBACK;
	const url =
		typeof value.url === 'string' && value.url.startsWith('/') && !value.url.startsWith('//')
			? value.url
			: '/';
	return { title: value.title, body: value.body, url };
}
