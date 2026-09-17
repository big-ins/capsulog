<script lang="ts">
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth/client';
	import { errorMessage, OFFLINE_MESSAGE } from '$lib/auth/form';
	import { signUpSchema, type SignUpInput } from '$lib/auth/schemas';
	import { parseForm, type FieldErrors } from '$lib/common/form';
	import AuthField from '$lib/auth/components/AuthField.svelte';
	import GoogleButton from '$lib/auth/components/GoogleButton.svelte';
	import SubmitError from '$lib/auth/components/SubmitError.svelte';

	let { data } = $props();

	let form = $state({ name: '', email: '', password: '' });
	let errors = $state<FieldErrors<SignUpInput>>({});
	let submitError = $state('');
	let busy = $state(false);
	let sentTo = $state('');

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;

		submitError = '';
		const result = parseForm(signUpSchema, form);
		errors = result.errors;
		if (!result.ok) return;

		busy = true;
		try {
			const { error } = await authClient.signUp.email({
				...result.value,
				callbackURL: data.redirectTo
			});
			if (error) {
				submitError = errorMessage(error.code);
				return;
			}
			// 登録済みのアドレスでも同じ画面を出す。ここで分けると登録の有無が分かる
			sentTo = result.value.email;
		} catch {
			submitError = OFFLINE_MESSAGE;
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>はじめる | カプセログ</title>
</svelte:head>

<div data-hero class="absolute inset-x-0 top-0 -z-10 h-17 bg-accent" aria-hidden="true"></div>

<main class="mx-auto flex max-w-sm flex-col gap-6 px-4 pt-24 pb-16">
	{#if sentTo}
		<h1 class="text-title font-extrabold">メールを送りました</h1>
		<div class="flex flex-col gap-3 rounded-3xl bg-surface p-5 shadow-clay">
			<p class="text-body font-bold break-all">{sentTo}</p>
			<p class="text-note leading-relaxed text-faint">
				届いたメールのリンクを開くと、登録が完了します。リンクの期限は24時間です。
			</p>
			<p class="text-note leading-relaxed text-faint">
				メールが見つからないときは、迷惑メールに振り分けられていないか確かめてください。
			</p>
		</div>
		<a href={resolve('/login')} class="text-center text-note font-bold text-accent underline">
			ログインへ
		</a>
	{:else}
		<div class="flex flex-col gap-2">
			<h1 class="text-title font-extrabold">カプセログをはじめる</h1>
			<p class="text-note leading-relaxed text-faint">
				登録すると、お気に入りと発売のリマインド、集めたものを飾る棚が使えます。
			</p>
		</div>

		<GoogleButton
			label="Google ではじめる"
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
				id="name"
				label="ニックネーム"
				type="text"
				autocomplete="username"
				bind:value={form.name}
				error={errors.name}
			/>
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
				autocomplete="new-password"
				placeholder="8文字以上"
				bind:value={form.password}
				error={errors.password}
			/>

			<SubmitError message={submitError} />

			<button
				type="submit"
				disabled={busy}
				class="pressable rounded-full bg-accent py-3 text-body font-bold text-on-accent shadow-clay-pressed disabled:opacity-60"
			>
				{busy ? '登録しています' : '登録する'}
			</button>
		</form>

		<a href={resolve('/login')} class="text-center text-note font-bold text-accent underline">
			アカウントをお持ちの方はこちら
		</a>
	{/if}
</main>
