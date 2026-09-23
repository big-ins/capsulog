<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
	import { canRemind, formatRelease, releaseStatus } from '$lib/calendar/format';
	import CapsuleBullet from '$lib/calendar/components/CapsuleBullet.svelte';
	import CapsuleRow from '$lib/calendar/components/CapsuleRow.svelte';
	import { capsuleColorAt } from '$lib/calendar/capsule';
	import MakerTag from '$lib/calendar/components/MakerTag.svelte';
	import ProductCard from '$lib/calendar/components/ProductCard.svelte';
	import StateButtons from '$lib/calendar/components/StateButtons.svelte';
	import SectionHeading from '$lib/common/components/SectionHeading.svelte';

	let { data } = $props();
	let product = $derived(data.product);
	let status = $derived(releaseStatus(product.yearMonth, product.precision, product.detail));
	let release = $derived(formatRelease(product.yearMonth, product.precision, product.detail));

	/* 見ていた一覧に帰る。絞り込みと並び順はクエリに入っている */
	let back = $derived(page.url.searchParams.get('back'));

	/* 読み進めている間は引っ込める。本文のボタンと重ならないようにする */
	let lastY = 0;
	let hidden = $state(false);

	function onScroll() {
		const y = window.scrollY;
		// 少し動かしただけで消えると、ちらついて読みにくい
		if (Math.abs(y - lastY) > 6) {
			hidden = y > lastY && y > 80;
			lastY = y;
		}
	}
</script>

<svelte:window onscroll={onScroll} />

<svelte:head>
	<title>{product.name} | カプセログ</title>
</svelte:head>

<main class="mx-auto flex max-w-2xl flex-col gap-5 px-4 pt-6 pb-28 lg:pt-24">
	<div>
		<div class="flex items-center gap-2">
			<MakerTag code={product.makerCode} name={product.makerName} />
			{#if status}
				<span
					class={[
						'inline-block rounded-full px-2.5 py-0.5 text-note font-extrabold',
						status === '発売済み' ? 'bg-ground text-faint shadow-clay-sm' : 'bg-sub text-white'
					]}
				>
					{status}
				</span>
			{/if}
			<!-- 右端に寄せる。商品名は長くなるので、同じ行には置かない -->
			<div class="ml-auto">
				<StateButtons
					productId={product.id}
					favorited={product.favorited}
					remind={product.remind}
					remindable={canRemind(product.yearMonth, product.precision, product.detail)}
				/>
			</div>
		</div>
		<h1 class="mt-2.5 text-title leading-relaxed font-extrabold text-balance">{product.name}</h1>
	</div>

	{#if product.totalVariants !== null}
		<CapsuleRow
			count={product.totalVariants}
			hasSecret={product.variants.some((variant) => variant.isSecret === 1)}
			seed={product.id}
		/>
	{/if}

	<ul class="grid grid-cols-3 gap-2.5">
		{#each [product.yearMonth ? `${release}発売` : release, product.price === null ? '価格不明' : `¥${product.price}`, product.totalVariants === null ? '種類数不明' : `全${product.totalVariants}種`] as value (value)}
			<!-- 2行分を確保して上下中央に置く。折り返しで箱の高さを変えない -->
			<li
				class="min-h-[2lh] content-center rounded-2xl bg-surface px-2 py-4 text-center text-body font-extrabold tabular-nums shadow-clay"
			>
				{value}
			</li>
		{/each}
	</ul>

	{#if product.variants.length > 0}
		<section>
			<SectionHeading title="ラインナップ" />
			<ul class="flex flex-col gap-2 rounded-3xl bg-surface p-4 shadow-clay">
				{#each product.variants as variant, index (variant.name)}
					<li
						class={[
							'flex items-center gap-2.5 text-body font-bold',
							variant.isSecret ? 'text-accent' : ''
						]}
					>
						<!-- 上のカプセル並びと同じ式で色を決め、n個目と n行目を揃える -->
						<CapsuleBullet
							color={capsuleColorAt(product.id, index)}
							secret={variant.isSecret === 1}
						/>
						{variant.name}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<a
		href={product.officialUrl}
		target="_blank"
		rel="noopener noreferrer"
		class="pressable inline-flex items-center justify-center gap-1 rounded-full bg-accent py-3 text-center text-body font-bold text-on-accent shadow-clay-pressed"
	>
		公式サイトで見る
		<ArrowUpRight size={16} aria-hidden="true" />
	</a>
	<p class="text-center text-note text-faint">情報の出典はメーカー公式サイト</p>

	{#if data.series.length > 0}
		<section class="pt-2">
			<SectionHeading title="シリーズの商品" />
			<ul class="flex flex-col gap-4 sm:grid sm:grid-cols-2">
				{#each data.series as item (item.id)}
					<li><ProductCard {item} /></li>
				{/each}
			</ul>
		</section>
	{/if}
</main>

<!-- スクロールしても付いてくるので、本文ではなくヘッダーと同じ幅に揃える -->
<!-- 引っ込むときは invisible も付ける。見えないものを Enter で押せないようにする -->
<div
	class="pointer-events-none fixed inset-x-0 bottom-32 z-10 px-4 transition-all duration-300 motion-reduce:transition-none lg:bottom-5"
	class:translate-y-24={hidden}
	class:opacity-0={hidden}
	class:invisible={hidden}
>
	<div class="mx-auto max-w-2xl lg:max-w-5xl">
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<!-- resolve() 起点でクエリを足すが、静的解析では追えない -->
		<a
			href={back ? `${resolve('/calendar')}?${back}` : resolve('/calendar')}
			class="pressable pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-surface px-5 py-3 text-body font-extrabold shadow-clay"
		>
			<ArrowLeft size={16} aria-hidden="true" />
			カレンダー
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</div>
</div>
