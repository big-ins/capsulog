<script lang="ts">
	import CircleUserRound from '@lucide/svelte/icons/circle-user-round';

	let { size = 56 }: { size?: number } = $props();
</script>

<!-- 写真は持たない。外部の画像を参照せず、扱うのはユーザーが撮った現物写真だけにする -->
<span
	class="grid flex-none place-items-center rounded-full bg-ground text-faint shadow-clay-inset"
	style="width: {size}px; height: {size}px"
>
	<CircleUserRound size={size * 0.6} aria-hidden="true" />
</span>
