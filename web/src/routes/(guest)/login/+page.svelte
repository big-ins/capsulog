<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth/client';
	import { errorMessage, OFFLINE_MESSAGE } from '$lib/auth/form';
	import { signInSchema, type SignInInput } from '$lib/auth/schemas';
	import { parseForm, type FieldErrors } from '$lib/common/form';
	import AuthField from '$lib/auth/components/AuthField.svelte';
	import GoogleButton from '$lib/auth/components/GoogleButton.svelte';
	import SubmitError from '$lib/auth/components/SubmitError.svelte';

	let { data } = $props();

	let form = $state({ email: '', password: '' });
	let errors = $state<FieldErrors<SignInInput>>({});
	let submitError = $state('');
	let busy = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		// disabled はボタン経由にしか効かない。入力欄での Enter が素通りする
		if (busy) return;

		submitError = '';
		const result = parseForm(signInSchema, form);
		errors = result.errors;
		if (!result.ok) return;

		busy = true;
		try {
			// ログインの失敗は error に入る。例外で飛ぶのは通信が切れたとき
			const { error } = await authClient.signIn.email(result.value);
			if (error) {
				submitError = errorMessage(error.code);
				return;
			}
			// 行き先は safeRedirect() で自分のサイトに限ってある。
			// 遷移しきるまで押せないままにする
			await goto(data.redirectTo, { invalidateAll: true });
		} catch {
			submitError = OFFLINE_MESSAGE;
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>ログイン | カプセログ</title>
</svelte:head>

<div data-hero class="absolute inset-x-0 top-0 -z-10 h-17 bg-accent" aria-hidden="true"></div>

<!-- 画面が広くても伸ばしきらない。入力欄が長いほど視線が横に流れ、読みにくくなる -->
<main class="mx-auto flex max-w-sm flex-col gap-5 px-4 pt-24 pb-16 sm:max-w-md sm:pt-28">
	<h1 class="px-1 text-title font-extrabold sm:text-site">ログイン</h1>

	<!-- 入力とボタンを1枚の面に載せる。面が浮き、その上で入力欄が窪む -->
	<div class="relative overflow-hidden rounded-3xl bg-surface p-5 shadow-clay sm:p-7">
		<span class="deco-circle absolute -top-4 -right-4 h-14 w-14 opacity-10" aria-hidden="true"
		></span>
		<span class="deco-square absolute -bottom-5 -left-5 h-16 w-16 opacity-10" aria-hidden="true"
		></span>

		<div class="relative flex flex-col gap-5">
			<GoogleButton
				label="Google でログイン"
				redirectTo={data.redirectTo}
				bind:busy
				onfail={(message) => (submitError = message)}
			/>

			<div class="flex items-center gap-3 text-note font-bold text-faint">
				<span class="h-px flex-1 bg-faint/25"></span>
				または
				<span class="h-px flex-1 bg-faint/25"></span>
			</div>

			<form class="flex flex-col gap-4" onsubmit={submit} novalidate>
				<AuthField
					id="email"
					label="メールアドレス"
					type="email"
					autocomplete="email"
					bind:value={form.email}
					error={errors.email}
				/>
				<AuthField
					id="password"
					label="パスワード"
					type="password"
					autocomplete="current-password"
					bind:value={form.password}
					error={errors.password}
				/>

				<SubmitError message={submitError} />

				<button
					type="submit"
					disabled={busy}
					class="pressable rounded-full bg-accent py-3 text-body font-bold text-on-accent shadow-clay-pressed disabled:opacity-60 sm:py-3.5"
				>
					{busy ? '確認しています' : 'ログイン'}
				</button>
			</form>
		</div>
	</div>

	<a href={resolve('/signup')} class="text-center text-note font-bold text-accent underline">
		はじめての方はこちら
	</a>
</main>

<style>
	/* 隅の装飾。円と四角を対角に置く。散らさず、面の角だけに留める */
	.deco-circle {
		background: var(--accent);
		border-radius: 50%;
	}
	.deco-square {
		background: var(--sub);
		transform: rotate(24deg);
	}
</style>
