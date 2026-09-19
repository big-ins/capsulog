<script lang="ts">
	import { page } from '$app/state';
	import { NAV_ITEMS, isCurrent } from '$lib/common/nav';
</script>

<nav
	class="fixed inset-x-0 bottom-0 z-10 border-t border-faint/15 bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
	aria-label="メインメニュー"
>
	<ul class="mx-auto flex max-w-md">
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<!-- 行き先は nav.ts で resolve() 済みだが、静的解析では追えない -->
		{#each NAV_ITEMS as item (item.label)}
			{@const current = isCurrent(item, page.url.pathname)}
			<li class="flex-1">
				{#if item.href}
					<a
						href={item.href}
						class={[
							'pressable-flat flex flex-col items-center gap-1 py-2.5',
							current ? 'text-accent' : 'text-faint'
						]}
						aria-current={current ? 'page' : undefined}
					>
						<item.icon size={22} aria-hidden="true" />
						<span class="text-note font-bold">{item.label}</span>
					</a>
				{:else}
					<span
						class="flex flex-col items-center gap-1 py-2.5 text-faint/50"
						aria-disabled="true"
						title="準備中"
					>
						<item.icon size={22} aria-hidden="true" />
						<span class="text-note font-bold">{item.label}</span>
					</span>
				{/if}
			</li>
		{/each}
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</ul>
</nav>
