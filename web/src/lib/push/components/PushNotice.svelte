<script lang="ts">
	import { page } from '$app/state';
	import Bell from '@lucide/svelte/icons/bell';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import SignUpDialog from '$lib/auth/components/SignUpDialog.svelte';
	import { push } from '../push.svelte';

	let { publicKey }: { publicKey: string } = $props();

	let busy = $state(false);
	let signUpOpen = $state(false);

	/*
	 * 押した直後に OS のダイアログを出す。iOS は押した操作の中でしか出させない。
	 * 許可しても断っても状態が変わり、この行は消える
	 */
	async function start() {
		if (busy) return;
		if (!page.data.user) {
			signUpOpen = true;
			return;
		}
		busy = true;
		try {
			await push.subscribe(publicKey);
		} catch {
			// 宛先を送れなくても、次に開いたときに送り直す
		}
		busy = false;
	}
</script>

<!-- ホーム画面に追加した人は、通知のために追加している。初めて開いたときに聞く -->
<button
	type="button"
	onclick={start}
	disabled={busy}
	class="pressable flex w-full items-center gap-3 rounded-2xl bg-surface px-4 py-3 text-left shadow-clay-sm disabled:opacity-60"
>
	<span class="grid h-8 w-8 flex-none place-items-center text-alert">
		<Bell size={22} fill="currentColor" aria-hidden="true" />
	</span>
	<span class="flex flex-1 flex-col">
		<span class="text-body font-bold">発売日の通知を受け取る</span>
		<span class="text-note text-faint">リマインドを付けた商品の発売時期にお知らせします</span>
	</span>
	<ChevronRight size={18} class="flex-none text-faint" aria-hidden="true" />
</button>

<SignUpDialog bind:open={signUpOpen} feature="発売日の通知" />
