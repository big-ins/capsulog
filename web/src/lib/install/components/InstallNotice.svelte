<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Share from '@lucide/svelte/icons/share';
	import SquarePlus from '@lucide/svelte/icons/square-plus';
	import * as Dialog from '$lib/common/components/ui/dialog';
	import { install } from '../install.svelte';

	let open = $state(false);
	let copied = $state(false);

	/** 呼べるならブラウザのインストール画面、呼べなければ手順を見せる */
	function start() {
		if (install.kind === 'prompt') install.prompt();
		else open = true;
	}

	/* 書き込めなくても URL は画面に出ている。選んでコピーしてもらえる */
	async function copyUrl() {
		try {
			await navigator.clipboard.writeText(location.origin);
			copied = true;
		} catch {
			copied = false;
		}
	}
</script>

<!-- お知らせとして置く。行ごと押せるようにし、ボタンを別に立てない -->
<button
	type="button"
	onclick={start}
	class="pressable flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left shadow-clay-sm"
>
	<img src="/icon.svg" alt="" class="h-8 w-8 flex-none" />
	<span class="flex-1 text-body font-bold">ホーム画面に追加して使えます</span>
	<ChevronRight size={18} class="flex-none text-faint" aria-hidden="true" />
</button>

<Dialog.Root bind:open>
	<Dialog.Content>
		{#if install.kind === 'ios-other'}
			<Dialog.Header>
				<Dialog.Title>Safari で開いてください</Dialog.Title>
				<Dialog.Description>
					iPhone では Safari からしか追加できません。アドレスをコピーして Safari で開いてください。
				</Dialog.Description>
			</Dialog.Header>
			<div class="flex flex-col gap-3">
				<p
					class="rounded-2xl bg-ground px-4 py-3 text-center text-body font-bold shadow-clay-inset select-all"
				>
					{location.origin}
				</p>
				<button
					type="button"
					onclick={copyUrl}
					class="pressable rounded-full bg-accent py-3 text-body font-bold text-on-accent shadow-clay-pressed"
				>
					{copied ? 'コピーしました' : 'アドレスをコピー'}
				</button>
			</div>
		{:else}
			<Dialog.Header>
				<Dialog.Title>ホーム画面に追加する</Dialog.Title>
				<Dialog.Description>アプリのように、アイコンから開けるようになります。</Dialog.Description>
			</Dialog.Header>
			<!-- 共有ボタンの位置は Safari の設定で変わる。場所を断定せず、見つからないときの逃げ道を添える -->
			<ol class="flex flex-col gap-3">
				<li class="flex items-center gap-3">
					<span
						class="grid h-10 w-10 flex-none place-items-center rounded-full bg-ground text-accent shadow-clay-inset"
					>
						<Share size={18} aria-hidden="true" />
					</span>
					<span class="flex flex-col">
						<span class="text-body font-bold">共有ボタンを押す</span>
						<span class="text-note text-faint">見当たらなければ「…」の中にあります</span>
					</span>
				</li>
				<li class="flex items-center gap-3">
					<span
						class="grid h-10 w-10 flex-none place-items-center rounded-full bg-ground text-accent shadow-clay-inset"
					>
						<SquarePlus size={18} aria-hidden="true" />
					</span>
					<span class="flex flex-col">
						<span class="text-body font-bold">「ホーム画面に追加」を選ぶ</span>
						<span class="text-note text-faint">無ければメニューを下へ送ります</span>
					</span>
				</li>
				<li class="flex items-center gap-3">
					<img src="/icon.svg" alt="" class="h-10 w-10 flex-none" />
					<span class="flex flex-col">
						<span class="text-body font-bold">ホーム画面のアイコンから開く</span>
						<span class="text-note text-faint">このページのままでは、アプリになりません</span>
					</span>
				</li>
			</ol>
		{/if}
	</Dialog.Content>
</Dialog.Root>
