<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth/client';
	import { errorMessage, OFFLINE_MESSAGE } from '$lib/auth/form';
	import { resetPasswordSchema } from '$lib/auth/schemas';
	import { parseForm, type FieldErrors } from '$lib/common/form';
	import AuthField from '$lib/auth/components/AuthField.svelte';
	import SubmitError from '$lib/auth/components/SubmitError.svelte';

	let { data } = $props();

	let form = $state({ password: '' });
	let errors = $state<FieldErrors<typeof form>>({});
	let submitError = $state('');
	let busy = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		// disabled はボタン経由にしか効かない。入力欄での Enter が素通りする
		if (busy) return;

		submitError = '';
		const result = parseForm(resetPasswordSchema, form);
		errors = result.errors;
		if (!result.ok || !data.token) return;

		busy = true;
		try {
			const { error } = await authClient.resetPassword({
				newPassword: result.value.password,
				token: data.token
			});
			if (error) {
				submitError = errorMessage(error.code);
				return;
			}
			// 前のセッションは切れている。入れ直してもらう
			await goto(resolve('/auth'));
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

<main class="mx-auto flex w-full max-w-sm flex-col gap-5 px-4 pt-6 sm:max-w-md lg:pt-28">
	{#if data.invalid || !data.token}
		<h1 class="px-1 text-title font-extrabold sm:text-site">リンクが使えません</h1>
		<div class="relative overflow-hidden rounded-3xl bg-surface p-5 shadow-clay sm:p-7">
			<span class="deco-circle absolute -top-4 -right-4 h-14 w-14 opacity-10" aria-hidden="true"
			></span>
			<div class="relative flex flex-col gap-4">
				<p class="text-body leading-relaxed">
					期限が切れているか、すでに使われています。もう一度お試しください。
				</p>
				<!-- resolve() 起点でクエリを足すが、静的解析では追えない -->
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a
					href="{resolve('/auth')}?mode=reset"
					class="pressable rounded-full bg-accent py-3 text-center text-body font-bold text-on-accent shadow-clay-pressed sm:py-3.5"
				>
					リンクを送り直す
				</a>
			</div>
		</div>
	{:else}
		<h1 class="px-1 text-title font-extrabold sm:text-site">パスワードの再設定</h1>

		<div class="relative overflow-hidden rounded-3xl bg-surface p-5 shadow-clay sm:p-7">
			<span class="deco-circle absolute -top-4 -right-4 h-14 w-14 opacity-10" aria-hidden="true"
			></span>
			<span class="deco-square absolute -bottom-5 -left-5 h-16 w-16 opacity-10" aria-hidden="true"
			></span>

			<form class="relative flex flex-col gap-4" onsubmit={submit} novalidate>
				<AuthField
					id="password"
					label="新しいパスワード"
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
					class="pressable rounded-full bg-accent py-3 text-body font-bold text-on-accent shadow-clay-pressed disabled:opacity-60 sm:py-3.5"
				>
					{busy ? '変えています' : 'パスワードを変える'}
				</button>
			</form>
		</div>
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
