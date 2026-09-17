import type { ZodType } from 'zod';

/** 項目名から、その項目のエラー文への対応。エラーが無い項目は持たない */
export type FieldErrors<T> = Partial<Record<keyof T & string, string>>;

export type ParseResult<T> =
	| { ok: true; value: T; errors: Record<string, never> }
	| { ok: false; value: null; errors: FieldErrors<T> };

/**
 * フォームの入力を検証する。
 * 1つの項目に複数のエラーが出ても、画面に出すのは最初の1つだけにする
 */
export function parseForm<T>(schema: ZodType<T>, input: unknown): ParseResult<T> {
	const result = schema.safeParse(input);
	if (result.success) return { ok: true, value: result.data, errors: {} };

	const errors: FieldErrors<T> = {};
	for (const issue of result.error.issues) {
		const field = issue.path[0];
		if (typeof field === 'string' && !(field in errors)) {
			errors[field as keyof T & string] = issue.message;
		}
	}
	return { ok: false, value: null, errors };
}
