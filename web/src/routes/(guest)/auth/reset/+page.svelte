<script lang="ts">
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth/client';
	import { errorMessage, OFFLINE_MESSAGE } from '$lib/auth/form';
	import { requestResetSchema } from '$lib/auth/schemas';
	import { parseForm, type FieldErrors } from '$lib/common/form';
	import AuthField from '$lib/auth/components/AuthField.svelte';
	import SubmitError from '$lib/auth/components/SubmitError.svelte';

	let form = $state({ email: '' });
	let errors = $state<FieldErrors<typeof form>>({});
	let submitError = $state('');
	let busy = $state(false);
	let sent = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		// disabled はボタン経由にしか効かない。入力欄での Enter が素通りする
		if (busy) return;

		submitError = '';
		const result = parseForm(requestResetSchema, form);
		errors = result.errors;
		if (!result.ok) return;

		busy = true;
		try {
			const { error } = await authClient.requestPasswordReset({
				email: result.value.email,
				redirectTo: resolve('/auth/reset/new')
			});
			if (error) {
				submitError = errorMessage(error.code);
				return;
			}
			// 登録の無いアドレスでも同じ画面を出す。ここで分けると登録の有無が分かる
			sent = true;
		} catch {
			submitError = OFFLINE_MESSAGE;
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>パスワードの再設定 | カプセログ</title>
</svelte:head>

<div data-hero class="absolute inset-x-0 top-0 -z-10 h-17 bg-accent" aria-hidden="true"></div>

<main class="mx-auto flex w-full max-w-sm flex-col gap-5 px-4 pt-24 pb-16 sm:max-w-md sm:pt-28">
	{#if sent}
		<h1 class="px-1 text-title font-extrabold sm:text-site">メールを送りました</h1>
		<div class="relative overflow-hidden rounded-3xl bg-surface p-5 shadow-clay sm:p-7">
			<span class="deco-circle absolute -top-4 -right-4 h-14 w-14 opacity-10" aria-hidden="true"
			></span>
			<div class="relative flex flex-col gap-3">
				<p class="text-heading font-bold break-all">{form.email}</p>
				<p class="text-body leading-relaxed">メールのリンクから、パスワードを再設定できます。</p>
				<p class="text-note leading-relaxed text-faint">
					メールが見つからないときは、迷惑メールに振り分けられていないか確かめてください。
					リンクの期限は1時間です。
				</p>
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-2 px-1">
			<h1 class="text-title font-extrabold sm:text-site">パスワードの再設定</h1>
			<p class="text-body leading-relaxed text-faint">
				登録したメールアドレスに、再設定のリンクを送ります。
			</p>
		</div>

		<div class="relative overflow-hidden rounded-3xl bg-surface p-5 shadow-clay sm:p-7">
			<span class="deco-circle absolute -top-4 -right-4 h-14 w-14 opacity-10" aria-hidden="true"
			></span>
			<span class="deco-square absolute -bottom-5 -left-5 h-16 w-16 opacity-10" aria-hidden="true"
			></span>

			<form class="relative flex flex-col gap-4" onsubmit={submit} novalidate>
				<AuthField
					id="email"
					label="メールアドレス"
					type="email"
					autocomplete="email"
					bind:value={form.email}
					error={errors.email}
				/>

				<SubmitError message={submitError} />

				<button
					type="submit"
					disabled={busy}
					class="pressable rounded-full bg-accent py-3 text-body font-bold text-on-accent shadow-clay-pressed disabled:opacity-60 sm:py-3.5"
				>
					{busy ? '送っています' : '再設定のリンクを送る'}
				</button>
			</form>
		</div>

		<a href={resolve('/auth')} class="text-center text-body font-bold text-accent underline">
			ログインへ戻る
		</a>
	{/if}
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
