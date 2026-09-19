<script lang="ts">
	import CircleUserRound from '@lucide/svelte/icons/circle-user-round';

	let {
		image,
		size = 56
	}: {
		/** 未設定なら共通の人アイコンを出す。アップロードの仕組みはまだ無い */
		image?: string | null;
		size?: number;
	} = $props();
</script>

{#if image}
	<img
		src={image}
		alt=""
		class="flex-none rounded-full object-cover shadow-clay-sm"
		style="width: {size}px; height: {size}px"
	/>
{:else}
	<span
		class="grid flex-none place-items-center rounded-full bg-ground text-faint shadow-clay-inset"
		style="width: {size}px; height: {size}px"
	>
		<CircleUserRound size={size * 0.6} aria-hidden="true" />
	</span>
{/if}
