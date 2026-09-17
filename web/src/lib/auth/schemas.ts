import { z } from 'zod';

/** Better Auth のパスワードの下限に合わせる */
export const PASSWORD_MIN_LENGTH = 8;

const email = z.email({ message: 'メールアドレスの形式が正しくありません' });

const password = z
	.string()
	.min(PASSWORD_MIN_LENGTH, { message: `パスワードは${PASSWORD_MIN_LENGTH}文字以上にしてください` })
	.max(128, { message: 'パスワードが長すぎます' });

export const signInSchema = z.object({ email, password });

export const signUpSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, { message: 'ニックネームを入力してください' })
		.max(30, { message: 'ニックネームは30文字までにしてください' }),
	email,
	password
});

export const requestResetSchema = z.object({ email });

export const resetPasswordSchema = z.object({ password });

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
