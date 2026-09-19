<script lang="ts">
	import { resolve } from '$app/paths';
	import MailCheck from '@lucide/svelte/icons/mail-check';
</script>

<svelte:head>
	<title>メールアドレスを確認しました | カプセログ</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-sm flex-col gap-5 px-4 pt-6 sm:max-w-md lg:pt-28">
	<h1 class="px-1 text-title font-extrabold sm:text-site">確認できました</h1>

	<div class="relative overflow-hidden rounded-3xl bg-surface p-5 shadow-clay sm:p-7">
		<span class="deco-circle absolute -top-4 -right-4 h-14 w-14 opacity-10" aria-hidden="true"
		></span>

		<div class="relative flex flex-col items-center gap-4 text-center">
			<span class="grid h-14 w-14 place-items-center rounded-full bg-sub text-white shadow-clay-sm">
				<MailCheck size={24} aria-hidden="true" />
			</span>
			<p class="text-body leading-relaxed">
				メールアドレスの確認が終わりました。<br />ログインしてはじめられます。
			</p>
			<a
				href={resolve('/auth')}
				class="pressable w-full rounded-full bg-accent py-3 text-center text-body font-bold text-on-accent shadow-clay-pressed sm:py-3.5"
			>
				ログインする
			</a>
		</div>
	</div>
</main>

<style>
	.deco-circle {
		background: var(--accent);
		border-radius: 50%;
	}
</style>
