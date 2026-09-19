import type { PageServerLoad } from './$types';

/*
 * 再設定のリンクを開いた先。
 * 期限切れや使用済みのトークンは error が付いて飛んでくる
 */
export const load: PageServerLoad = async ({ url }) => {
	return {
		token: url.searchParams.get('token'),
		invalid: url.searchParams.has('error')
	};
};
