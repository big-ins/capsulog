<script lang="ts">
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import * as Dialog from '$lib/common/components/ui/dialog';
	import { install } from '../install.svelte';
	import InstallSteps from './InstallSteps.svelte';

	let open = $state(false);

	/** 呼べるならブラウザのインストール画面、呼べなければ手順を見せる */
	function start() {
		if (install.kind === 'prompt') install.prompt();
		else open = true;
	}
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
		<InstallSteps kind={install.kind === 'ios-other' ? 'ios-other' : 'ios-safari'} />
	</Dialog.Content>
</Dialog.Root>
