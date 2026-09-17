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

<main class="mx-auto flex max-w-sm flex-col gap-6 px-4 pt-24 pb-16">
	<h1 class="text-title font-extrabold">ログイン</h1>

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
			class="pressable rounded-full bg-accent py-3 text-body font-bold text-on-accent shadow-clay-pressed disabled:opacity-60"
		>
			{busy ? '確認しています' : 'ログイン'}
		</button>
	</form>

	<div class="flex flex-col items-center gap-2.5 text-note font-bold">
		<a href={resolve('/signup')} class="text-accent underline">はじめての方はこちら</a>
	</div>
</main>
