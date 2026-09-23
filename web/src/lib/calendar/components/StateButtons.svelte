<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import Bell from '@lucide/svelte/icons/bell';
	import Heart from '@lucide/svelte/icons/heart';
	import SignUpDialog from '$lib/auth/components/SignUpDialog.svelte';

	let {
		productId,
		favorited,
		remind
	}: {
		productId: number;
		favorited: number;
		remind: number;
	} = $props();

	let loggedIn = $derived(!!page.data.user);

	let on = $derived({ favorited: !!favorited, remind: !!remind });

	let dialogOpen = $state(false);
	let dialogFeature = $state('');

	const BUTTONS = [
		{ kind: 'favorited', icon: Heart, label: 'お気に入り' },
		{ kind: 'remind', icon: Bell, label: '発売リマインド' }
	] as const;

	/** 登録していない人にはダイアログで先に何があるかを見せる */
	function askToSignUp(label: string) {
		dialogFeature = label;
		dialogOpen = true;
	}
</script>

<div class="flex items-center gap-1">
	{#each BUTTONS as button (button.kind)}
		{@const Icon = button.icon}
		{@const active = on[button.kind]}
		{#if loggedIn}
			<form
				method="POST"
				action="?/toggleState"
				use:enhance={() =>
					// 押した分だけを load で取り直す。一覧の読み進めた分は保つ
					async ({ update }) =>
						await update({ reset: false, invalidateAll: true })}
			>
				<input type="hidden" name="productId" value={productId} />
				<input type="hidden" name="kind" value={button.kind} />
				<button
					type="submit"
					aria-label={button.label}
					aria-pressed={active}
					class={[
						'pressable-flat grid h-8 w-8 place-items-center rounded-full transition-colors',
						active ? 'text-accent' : 'text-faint/50'
					]}
				>
					<Icon size={18} fill={active ? 'currentColor' : 'none'} aria-hidden="true" />
				</button>
			</form>
		{:else}
			<button
				type="button"
				aria-label={button.label}
				onclick={() => askToSignUp(button.label)}
				class="pressable-flat grid h-8 w-8 place-items-center rounded-full text-faint/50"
			>
				<Icon size={18} aria-hidden="true" />
			</button>
		{/if}
	{/each}
</div>

<SignUpDialog bind:open={dialogOpen} feature={dialogFeature} />
