const ENDPOINT = 'https://api.resend.com/emails';

export type MailEnv = {
	RESEND_API_KEY: string;
	MAIL_FROM: string;
};

type Mail = {
	to: string;
	subject: string;
	text: string;
};

/**
 * Resend でメールを送る。Workers は SMTP を使えないため HTTP API を呼ぶ。
 * 送れなかったときは例外を投げる
 */
export async function sendMail(env: MailEnv, mail: Mail): Promise<void> {
	const response = await fetch(ENDPOINT, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			from: env.MAIL_FROM,
			to: mail.to,
			subject: mail.subject,
			text: mail.text
		})
	});

	if (!response.ok) {
		throw new Error(`メールを送れなかった: ${response.status} ${await response.text()}`);
	}
}

export function verificationMail(url: string): Omit<Mail, 'to'> {
	return {
		subject: 'カプセログ メールアドレスの確認',
		text: [
			'カプセログにご登録いただきありがとうございます。',
			'',
			'次のリンクを開くと登録が完了します。',
			url,
			'',
			'リンクの期限は24時間です。',
			'心当たりがない場合は、このメールを破棄してください。'
		].join('\n')
	};
}

export function resetPasswordMail(url: string): Omit<Mail, 'to'> {
	return {
		subject: 'カプセログ パスワードの再設定',
		text: [
			'次のリンクからパスワードを再設定できます。',
			url,
			'',
			'リンクの期限は1時間です。',
			'心当たりがない場合は、このメールを破棄してください。パスワードは変わりません。'
		].join('\n')
	};
}
