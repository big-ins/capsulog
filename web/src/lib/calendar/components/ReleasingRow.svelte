<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import { fade } from 'svelte/transition';
	import type { ProductListItem } from '../types';
	import ProductCard from './ProductCard.svelte';

	let { items }: { items: ProductListItem[] } = $props();

	/* 端を薄れさせる幅。カードの端が覗く量より狭くし、次があることは見えるように残す */
	const FADE = '2.5rem';

	let scroller = $state<HTMLElement | null>(null);
	let atStart = $state(true);
	let atEnd = $state(true);

	/* 端まで来た側のボタンを消す。1px の余裕は、拡大率によって端数が出るため */
	function measure() {
		if (!scroller) return;
		atStart = scroller.scrollLeft <= 1;
		atEnd = scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 1;
	}

	/* 幅が変わると、同じ位置でも端かどうかが変わる。件数が変わったときも測り直す */
	$effect(() => {
		void items.length;
		if (!scroller) return;
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(scroller);
		return () => observer.disconnect();
	});

	/*
	 * 見えている幅の分だけ送る。止まる位置はカードの頭に吸い付くので、端数は気にしなくてよい。
	 * 全幅だと、次のカードの頭を行き過ぎて1枚飛ばすことがある。少し手前で止める
	 */
	let buttons = $derived([
		{ direction: -1, hidden: atStart, label: '前へ', icon: ChevronLeft, side: '-left-3' },
		{ direction: 1, hidden: atEnd, label: '次へ', icon: ChevronRight, side: '-right-3' }
	] as const);

	function page(direction: 1 | -1) {
		if (!scroller) return;
		const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
		scroller.scrollBy({
			left: direction * scroller.clientWidth * 0.9,
			behavior: reduced ? 'auto' : 'smooth'
		});
	}
</script>

<!--
  横に流す。件数が増えても縦に伸ばさず、ホームの下の中身を押し下げない。
  指で流せる端末ではボタンを出さない。重なって、カードの端を隠すだけになる
-->
<div class="relative">
	<!--
	  左右は画面の端まで広げ、カードが端から流れて見えるようにする。
	  上下の余白は影とホバーの浮きの分。スクロールの枠で切られないようにする。
	  PC は中身の幅が画面の途中で終わり、そこでカードが切れる。続きがある側だけ端を薄れさせる
	-->
	<ul
		bind:this={scroller}
		onscroll={measure}
		class="fade-edges -mx-4 flex snap-x snap-mandatory scroll-px-4 scrollbar-none gap-4 overflow-x-auto px-4 pt-3 pb-8 lg:-mx-10 lg:scroll-px-10 lg:px-10 [&::-webkit-scrollbar]:hidden"
		style:--fade-start={atStart ? '0px' : FADE}
		style:--fade-end={atEnd ? '0px' : FADE}
	>
		{#each items as item (item.id)}
			<!-- 幅はカレンダーの一覧の列と揃える。スマホだけは次のカードを覗かせる -->
			<li
				class="w-[80%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)] 2xl:w-[calc((100%-4rem)/5)]"
			>
				<ProductCard {item} />
			</li>
		{/each}
	</ul>

	<!-- 縦はカードの中央に置く。下の余白が上より広いので、その差の半分だけ上げる -->
	{#each buttons as button (button.direction)}
		{@const Icon = button.icon}
		{#if !button.hidden}
			<button
				type="button"
				aria-label={button.label}
				onclick={() => page(button.direction)}
				class={[
					'pressable absolute top-[calc(50%-0.625rem)] hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-surface text-ink shadow-clay-sm pointer-fine:grid',
					button.side
				]}
				transition:fade={{ duration: 150 }}
			>
				<Icon size={20} aria-hidden="true" />
			</button>
		{/if}
	{/each}
</div>

<style>
	/* 長さとして登録すると、端に着いたときに薄れが消える様子を遷移で見せられる */
	@property --fade-start {
		syntax: '<length>';
		inherits: false;
		initial-value: 0px;
	}
	@property --fade-end {
		syntax: '<length>';
		inherits: false;
		initial-value: 0px;
	}

	.fade-edges {
		mask-image: linear-gradient(
			to right,
			transparent,
			#000 var(--fade-start),
			#000 calc(100% - var(--fade-end)),
			transparent
		);
		transition:
			--fade-start 0.2s ease,
			--fade-end 0.2s ease;
	}
</style>
