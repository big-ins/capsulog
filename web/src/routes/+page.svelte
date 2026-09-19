<script lang="ts">
	import FlipNumber from '$lib/common/components/FlipNumber.svelte';
	import PageHeading from '$lib/common/components/PageHeading.svelte';

	let { data } = $props();
</script>

<svelte:head><title>カプセログ</title></svelte:head>

<main class="mx-auto max-w-2xl px-4 pt-6 pb-16 lg:max-w-5xl lg:pt-24">
	<PageHeading title="カプセログ" />

	<p class="text-body text-faint">
		{data.makerCount}社 {data.productCount.toLocaleString('ja-JP')}件のカプセルトイを掲載中！
	</p>

	<div class="flex flex-col gap-1 pt-6">
		<p class="text-body font-bold text-faint">コレクション</p>
		<p class="flex items-baseline gap-1 text-accent">
			<span class="text-count font-extrabold">
				<FlipNumber value={data.collectionCount} />
			</span>
			<span class="text-title font-extrabold text-ink">件</span>
		</p>
	</div>
</main>
