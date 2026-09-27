<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ProductListItem } from '../types';
	import { formatReleaseInYear } from '../format';
	import MakerTag from './MakerTag.svelte';
	import StateButtons from './StateButtons.svelte';

	/*
	 * ホームに並べる、発売期間中のリマインド。付けたものが今出ていると気づかせるためのもの。
	 * 比べて選ぶための数字（全何種・価格）は載せない。詳細を開けば見られる
	 */
	let { item }: { item: ProductListItem } = $props();
</script>

<!-- ボタンはリンクの中に置けない。重ねて出すため、包んで位置の基準にする -->
<div class="relative h-full">
	<a
		href={resolve('/products/[id]', { id: String(item.id) })}
		class="pressable relative flex h-full flex-col overflow-hidden rounded-3xl bg-surface px-4 py-3.5 shadow-clay"
	>
		<span class="deco absolute -top-3 -right-3 z-0 h-10 w-10 opacity-15" aria-hidden="true"></span>
		<div class="relative z-10">
			<MakerTag code={item.makerCode} name={item.makerName} />
		</div>
		<!-- 2行分を確保してカードの高さを揃える -->
		<h3 class="mt-2 min-h-[2lh] text-body leading-relaxed font-bold">
			<span class="line-clamp-2">{item.name}</span>
		</h3>
		<!-- ここで一番知りたいのは、いつ店頭に並びうるか。右端はボタンの居場所 -->
		{#if item.yearMonth}
			<p class="mt-auto pt-1 pr-12 text-body font-extrabold">
				{formatReleaseInYear(item.yearMonth, item.precision, item.detail)}
			</p>
		{/if}
	</a>

	<!-- 外す操作だけ。お気に入りは一覧で扱う -->
	<div class="absolute right-1.5 bottom-0.5">
		<StateButtons
			productId={item.id}
			favorited={item.favorited}
			remind={item.remind}
			release={item}
			kinds={['remind']}
		/>
	</div>
</div>

<style>
	/* カードの隅の装飾。一覧のカードと同じく、偶数番目は円でなく四角にする */
	.deco {
		background: var(--accent);
		border-radius: 50%;
	}
	:global(li:nth-child(even)) .deco {
		background: var(--sub);
		border-radius: 0;
		transform: rotate(24deg);
	}
</style>
