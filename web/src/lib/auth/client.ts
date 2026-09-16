import { createAuthClient } from 'better-auth/svelte';
import { inferAdditionalFields } from 'better-auth/client/plugins';
import { userFields } from './fields';

/*
 * 画面から認証を呼ぶための入口。
 * baseURL は書かない。サイト自身の /api/auth へ送る
 */
export const authClient = createAuthClient({
	plugins: [inferAdditionalFields({ user: userFields })]
});

export const { signIn, signUp, signOut } = authClient;
