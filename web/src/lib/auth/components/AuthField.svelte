<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';

	type Props = {
		id: string;
		label: string;
		type: 'text' | 'email' | 'password';
		value: string;
		error?: string;
		autocomplete?: HTMLInputElement['autocomplete'];
		placeholder?: string;
	};

	let { id, label, type, value = $bindable(), error, autocomplete, placeholder }: Props = $props();

	/* 伏せ字は打ち間違えても気づけない。押している間だけ見せる。既定は伏せたまま */
	let revealed = $state(false);
	let shownType = $derived(type === 'password' && revealed ? 'text' : type);
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class="text-note font-extrabold text-faint">{label}</label>
	<div class="relative">
		<input
			{id}
			{autocomplete}
			{placeholder}
			type={shownType}
			bind:value
			aria-invalid={error ? 'true' : undefined}
			aria-errormessage={error ? `${id}-error` : undefined}
			class={[
				'w-full rounded-2xl bg-ground px-4 py-3 text-input shadow-clay-inset outline-none placeholder:text-faint sm:py-3.5',
				type === 'password' ? 'pr-12' : '',
				error ? 'ring-2 ring-accent' : 'focus:ring-2 focus:ring-sub'
			]}
		/>
		{#if type === 'password'}
			<button
				type="button"
				onclick={() => (revealed = !revealed)}
				aria-label={revealed ? 'パスワードを隠す' : 'パスワードを表示する'}
				aria-pressed={revealed}
				class="pressable-flat absolute inset-y-0 right-0 grid w-12 place-items-center text-faint"
			>
				{#if revealed}
					<EyeOff size={18} aria-hidden="true" />
				{:else}
					<Eye size={18} aria-hidden="true" />
				{/if}
			</button>
		{/if}
	</div>
	{#if error}
		<p id="{id}-error" class="text-note font-bold text-accent">{error}</p>
	{/if}
</div>
