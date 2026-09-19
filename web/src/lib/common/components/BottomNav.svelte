<script lang="ts">
	import { page } from '$app/state';
	import { NAV_ITEMS, isCurrent } from '$lib/common/nav';

	/*
	 * 敷いたピルを動かすための位置。
	 * 項目ごとに敷くと、移ったときに前のものが消えて次が現れる。
	 * 1枚だけ持って左右に滑らせると、同じものが動いたように見える
	 */
	let currentIndex = $derived(NAV_ITEMS.findIndex((item) => isCurrent(item, page.url.pathname)));
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-10 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] lg:hidden"
	aria-label="メインメニュー"
>
	<ul class="relative mx-auto flex max-w-sm rounded-full bg-surface p-1.5 shadow-clay">
		{#if currentIndex >= 0}
			<!-- 選択中の項目に敷く面。幅は項目数で割り、左端からの距離で位置を決める -->
			<li
				class="pill absolute inset-y-1.5 rounded-full bg-accent shadow-clay-pressed"
				style="--count: {NAV_ITEMS.length}; --index: {currentIndex}"
				aria-hidden="true"
			></li>
		{/if}

		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<!-- 行き先は nav.ts で resolve() 済みだが、静的解析では追えない -->
		{#each NAV_ITEMS as item (item.label)}
			{@const current = isCurrent(item, page.url.pathname)}
			{@const Icon = item.icon}
			<li class="relative flex-1">
				{#if item.href}
					<a
						href={item.href}
						class={[
							'flex flex-col items-center gap-0.5 rounded-full py-2 transition-colors',
							current ? 'text-on-accent' : 'text-faint'
						]}
						aria-current={current ? 'page' : undefined}
					>
						<Icon size={20} aria-hidden="true" />
						<span class="text-note font-bold">{item.label}</span>
					</a>
				{:else}
					<span
						class="flex flex-col items-center gap-0.5 py-2 text-faint/40"
						aria-disabled="true"
						title="準備中"
					>
						<Icon size={20} aria-hidden="true" />
						<span class="text-note font-bold">{item.label}</span>
					</span>
				{/if}
			</li>
		{/each}
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</ul>
</nav>

<style>
	/* 項目は等分に並ぶ。左右の余白を除いた幅を項目数で割る */
	.pill {
		width: calc((100% - 0.75rem) / var(--count));
		left: calc(0.375rem + (100% - 0.75rem) / var(--count) * var(--index));
		transition: left var(--duration-open) var(--ease-bounce);
	}
	@media (prefers-reduced-motion: reduce) {
		.pill {
			transition: none;
		}
	}
</style>
