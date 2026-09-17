<script lang="ts">
	import { authClient } from '../client';
	import { OFFLINE_MESSAGE } from '../form';
	import GoogleMark from './GoogleMark.svelte';

	let {
		label,
		redirectTo,
		busy = $bindable(),
		onfail
	}: {
		label: string;
		redirectTo: string;
		busy: boolean;
		onfail: (message: string) => void;
	} = $props();

	async function signInWithGoogle() {
		if (busy) return;
		busy = true;
		try {
			// 成功すると Google へ飛ぶ。戻ってくるのは別の読み込みになる
			await authClient.signIn.social({ provider: 'google', callbackURL: redirectTo });
		} catch {
			onfail(OFFLINE_MESSAGE);
			busy = false;
		}
	}
</script>

<button
	type="button"
	disabled={busy}
	onclick={signInWithGoogle}
	class="pressable flex items-center justify-center gap-2.5 rounded-full bg-surface py-3 text-body font-bold shadow-clay disabled:opacity-60"
>
	<GoogleMark />
	{label}
</button>
