<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { authClient } from '$lib/auth/client';
	import { BENEFITS } from '$lib/auth/benefits';
	import { OFFLINE_MESSAGE } from '$lib/auth/form';
	import UserAvatar from '$lib/auth/components/UserAvatar.svelte';
	import SubmitError from '$lib/auth/components/SubmitError.svelte';
	import PageHeading from '$lib/common/components/PageHeading.svelte';

	let user = $derived(page.data.user);

	let busy = $state(false);
	let submitError = $state('');

	async function logOut() {
		if (busy) return;
		busy = true;
		submitError = '';
		try {
			const { error } = await authClient.signOut();
			if (error) {
				submitError = 'ログアウトできませんでした。時間をおいてお試しください';
				busy = false;
				return;
			}
			// 画面が持っている user を捨てる。残すとログイン済みのまま見える
			await goto(resolve('/mypage'), { invalidateAll: true });
		} catch {
			submitError = OFFLINE_MESSAGE;
		}
		busy = false;
	}
</script>

<svelte:head><title>マイページ | カプセログ</title></svelte:head>

<main class="mx-auto max-w-2xl px-4 pt-6 pb-16 lg:max-w-5xl lg:pt-24">
	<PageHeading title="マイページ" />

	<div class="flex items-center gap-4 rounded-3xl bg-surface p-5 shadow-clay">
		<UserAvatar image={user?.image} />
		<div class="flex min-w-0 flex-col gap-0.5">
			<p class="text-heading font-extrabold">{user?.name ?? 'ゲスト'}</p>
			{#if user}
				<p class="truncate text-note text-faint">{user.email}</p>
			{/if}
		</div>
	</div>

	{#if user}
		<div class="flex flex-col gap-3 pt-6">
			<SubmitError message={submitError} />
			<button
				type="button"
				disabled={busy}
				onclick={logOut}
				class="pressable rounded-full bg-surface py-3 text-body font-bold text-faint shadow-clay-sm disabled:opacity-60"
			>
				{busy ? 'ログアウトしています' : 'ログアウト'}
			</button>
		</div>
	{:else}
		<div class="flex flex-col gap-3 pt-6">
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<!-- resolve() 起点でクエリを足すが、静的解析では追えない -->
			<a
				href="{resolve('/auth')}?mode=signup&redirect=/mypage"
				class="pressable rounded-full bg-accent py-3 text-center text-body font-bold text-on-accent shadow-clay-pressed"
			>
				新規登録
			</a>
			<a
				href="{resolve('/auth')}?redirect=/mypage"
				class="pressable rounded-full bg-surface py-3 text-center text-body font-bold shadow-clay-sm"
			>
				ログイン
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		</div>

		<p class="pt-8 pb-3 text-body font-bold text-faint">登録すると使えます</p>
		<ul class="flex flex-col gap-3">
			{#each BENEFITS as benefit (benefit.label)}
				{@const Icon = benefit.icon}
				<li class="flex items-center gap-3.5 rounded-3xl bg-surface p-4 shadow-clay-sm">
					<span
						class="grid h-10 w-10 flex-none place-items-center rounded-full bg-ground text-accent shadow-clay-inset"
					>
						<Icon size={18} aria-hidden="true" />
					</span>
					<span class="flex flex-col gap-0.5">
						<span class="text-body font-extrabold">{benefit.label}</span>
						<span class="text-note text-faint">{benefit.note}</span>
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</main>
