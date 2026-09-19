<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { NAV_ITEMS, isCurrent } from '$lib/common/nav';
</script>

<!--
  中身の幅には合わせない。ロゴとナビの分だけの面を、左に寄せて浮かせる。
  z は中身より上に置く。カードの中にも z-10 があり、同じ値では後から描かれた側が勝つ
-->
<header class="fixed inset-x-0 top-0 z-30 px-4 pt-3">
	<div class="mx-auto max-w-2xl lg:max-w-5xl">
		<div class="floating inline-flex items-center gap-6 rounded-full bg-surface px-5 py-2.5">
			<a href={resolve('/')} class="text-site font-extrabold text-accent">
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
								<a
									href={item.href}
									class={[
										'pressable-flat block rounded-full px-4 py-1.5 text-body font-bold transition-colors',
										current ? 'bg-accent text-on-accent shadow-clay-pressed' : 'text-faint'
									]}
									aria-current={current ? 'page' : undefined}
								>
									{item.label}
								</a>
							{:else}
								<span
									class="block px-4 py-1.5 text-body font-bold text-faint/40"
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
	</div>
</header>

<style>
	/* クレイの影から外側の白いハイライトだけ抜いたもの。
	   固定ヘッダの後ろは中身が通るため、白を撒くと下の文字が霞む。
	   内側の明暗は面の中に収まるので、そのまま残して立体感を保つ */
	.floating {
		box-shadow:
			9px 11px 22px var(--sh),
			inset 2px 3px 5px var(--hi-in),
			inset -3px -5px 9px var(--sh-in);
	}
</style>
