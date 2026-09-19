<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { NAV_ITEMS, isCurrent } from '$lib/common/nav';

	let scrollY = $state(0);
	let heroHeight = $state(0);

	// 各ページの色エリア（data-hero）の高さを測る。遷移のたびに測り直す
	$effect(() => {
		void page.url.pathname;
		heroHeight = document.querySelector('[data-hero]')?.clientHeight ?? 0;
	});

	// 色エリアの下端がヘッダーの裏を抜けて、背景がクリームに変わるところで白い帯にする
	let floating = $derived(scrollY > Math.max(heroHeight - 80, 16));
</script>

<svelte:window bind:scrollY />

<header
	class={[
		'fixed inset-x-0 top-0 z-10 px-4 py-4 transition-colors duration-300',
		floating ? 'floating text-accent' : 'text-white'
	]}
>
	<div class="mx-auto flex max-w-2xl items-center gap-8 lg:max-w-5xl">
		<a href={resolve('/')} class="text-site font-extrabold">
			カプセ<span class="text-ink">ログ</span>
		</a>

		<!-- 狭い画面は下部ナビが受け持つ -->
		<nav class="hidden lg:block" aria-label="メインメニュー">
			<ul class="flex items-center gap-1">
				<!-- eslint-disable svelte/no-navigation-without-resolve -->
				<!-- 行き先は nav.ts で resolve() 済みだが、静的解析では追えない -->
				{#each NAV_ITEMS as item (item.label)}
					{@const current = isCurrent(item, page.url.pathname)}
					<li>
						{#if item.href}
							<!-- 色エリアの上では白いピル。白帯に変わったらアクセント色に入れ替える -->
							<a
								href={item.href}
								class={[
									'pressable-flat block rounded-full px-4 py-1.5 text-body font-bold transition-colors',
									current && floating && 'bg-accent text-on-accent shadow-clay-pressed',
									current && !floating && 'bg-white text-accent shadow-clay-on-color',
									!current && 'opacity-60'
								]}
								aria-current={current ? 'page' : undefined}
							>
								{item.label}
							</a>
						{:else}
							<span
								class="block px-4 py-1.5 text-body font-bold opacity-40"
								aria-disabled="true"
								title="準備中"
							>
								{item.label}
							</span>
						{/if}
					</li>
				{/each}
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			</ul>
		</nav>
	</div>
</header>

<style>
	/* 白帯の背景。下に向かって色もぼかしも透けていく。
	   opacity の遷移で出し入れし、文字の色遷移と同期させる */
	header::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		opacity: 0;
		transition: opacity 300ms;
		background: color-mix(in srgb, var(--surface) 90%, transparent);
		backdrop-filter: blur(10px);
		mask-image: linear-gradient(to bottom, black 55%, transparent);
	}
	header.floating::before {
		opacity: 1;
	}
</style>
