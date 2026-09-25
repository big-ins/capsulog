<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Copy from '@lucide/svelte/icons/copy';
	import Share from '@lucide/svelte/icons/share';
	import SquarePlus from '@lucide/svelte/icons/square-plus';
	import * as Dialog from '$lib/common/components/ui/dialog';
	import { install } from '../install.svelte';

	let open = $state(false);
	let copied = $state(false);

	/* 追加すると変わること。iPhone は追加しないと通知が届かない */
	const BENEFITS = [
		'発売日に通知が届く',
		'アイコンからすぐ開ける',
		'アドレスバーが消え、画面を広く使える'
	];

	/** 呼べるならブラウザのインストール画面、呼べなければ手順を見せる */
	function start() {
		if (install.kind === 'prompt') install.prompt();
		else open = true;
	}

	/*
	 * 「コピーしました」を出しておく長さ。出したままだと、押し直しても何も変わらず、
	 * コピーできたのか分からない
	 */
	const COPIED_MS = 2000;
	let copiedTimer: ReturnType<typeof setTimeout> | undefined;
	// 押した回数。チェックを作り直して、押すたびに跳ねさせる
	let copies = $state(0);

	/* 書き込めなくても URL は画面に出ている。選んでコピーしてもらえる */
	async function copyUrl() {
		try {
			await navigator.clipboard.writeText(location.origin);
		} catch {
			return;
		}
		copied = true;
		copies++;
		clearTimeout(copiedTimer);
		copiedTimer = setTimeout(() => (copied = false), COPIED_MS);
	}

	/* 閉じたら戻す。次に開いたとき、前のコピーの結果が残って見えないように */
	$effect(() => {
		if (open) return;
		clearTimeout(copiedTimer);
		copied = false;
	});
</script>

<!-- お知らせとして置く。行ごと押せるようにし、ボタンを別に立てない -->
<button
	type="button"
	onclick={start}
	class="pressable flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left shadow-clay-sm"
>
	<img src="/icon.svg" alt="" class="h-8 w-8 flex-none" />
	<!-- Android と PC はシートを通らない。一番強い理由だけをここで伝える -->
	<span class="flex flex-1 flex-col">
		<span class="text-body font-bold">ホーム画面に追加して使えます</span>
		<span class="text-note text-faint">発売日に通知が届きます</span>
	</span>
	<ChevronRight size={18} class="flex-none text-faint" aria-hidden="true" />
</button>

<Dialog.Root bind:open>
	<Dialog.Content>
		{#if install.kind === 'ios-other'}
			<Dialog.Header>
				<Dialog.Title>Safari で開いてください</Dialog.Title>
				<Dialog.Description>
					iPhone では Safari からしか追加できません。<br />
					アドレスをコピーして Safari で開いてください。
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
					class="pressable inline-flex items-center justify-center gap-1.5 rounded-full bg-accent py-3 text-body font-bold text-on-accent shadow-clay-pressed"
				>
					{#if copied}
						{#key copies}
							<span class="state-pop inline-flex">
								<Check size={16} aria-hidden="true" />
							</span>
						{/key}
						コピーしました
					{:else}
						<Copy size={16} aria-hidden="true" />
						アドレスをコピー
					{/if}
				</button>
			</div>
		{:else}
			<Dialog.Header>
				<Dialog.Title>ホーム画面に追加する</Dialog.Title>
			</Dialog.Header>
			<!-- できることと手順は性質が違う。見出しを付け、間を広げて別の塊に見せる -->
			<section class="flex flex-col gap-2">
				<h3 class="text-body font-bold text-faint">追加するとできること</h3>
				<ul class="flex flex-col gap-1.5">
					{#each BENEFITS as benefit (benefit)}
						<li class="flex items-center gap-2 text-body">
							<Check size={16} class="flex-none text-accent" aria-hidden="true" />
							{benefit}
						</li>
					{/each}
				</ul>
			</section>
			<section class="flex flex-col gap-2 pt-2">
				<h3 class="text-body font-bold text-faint">追加のしかた</h3>
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
						<span class="text-body font-bold">「ホーム画面に追加」を選ぶ</span>
					</li>
					<li class="flex items-center gap-3">
						<img src="/icon.svg" alt="" class="h-10 w-10 flex-none" />
						<span class="text-body font-bold">ホーム画面のアイコンから開く</span>
					</li>
				</ol>
			</section>
		{/if}
	</Dialog.Content>
</Dialog.Root>
