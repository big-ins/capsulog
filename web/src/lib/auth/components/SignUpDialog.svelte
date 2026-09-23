<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import * as Dialog from '$lib/common/components/ui/dialog';

	let {
		open = $bindable(false),
		/** 何をしようとしたか。「〇〇を使うには」の〇〇に入る */
		feature
	}: {
		open?: boolean;
		feature: string;
	} = $props();

	/* 登録した後、いま見ている画面に戻す */
	let redirect = $derived(encodeURIComponent(page.url.pathname + page.url.search));
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>{feature}を使うには</Dialog.Title>
			<Dialog.Description>
				登録すると、気になる商品を残したり、発売の予定を受け取れます。
			</Dialog.Description>
		</Dialog.Header>

		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<!-- resolve() 起点でクエリを足すが、静的解析では追えない -->
		<div class="flex flex-col gap-3">
			<a
				href="{resolve('/auth')}?mode=signup&redirect={redirect}"
				class="pressable rounded-full bg-accent py-3 text-center text-body font-bold text-on-accent shadow-clay-pressed"
			>
				新規登録
			</a>
			<a
				href="{resolve('/auth')}?redirect={redirect}"
				class="pressable rounded-full bg-ground py-3 text-center text-body font-bold shadow-clay-sm"
			>
				ログイン
			</a>
		</div>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	</Dialog.Content>
</Dialog.Root>
