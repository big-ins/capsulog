<script lang="ts">
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
</script>

<div class="flex flex-col gap-1.5">
	<label for={id} class="text-note font-extrabold text-faint">{label}</label>
	<input
		{id}
		{type}
		{autocomplete}
		{placeholder}
		bind:value
		aria-invalid={error ? 'true' : undefined}
		aria-errormessage={error ? `${id}-error` : undefined}
		class={[
			'w-full rounded-2xl bg-ground px-4 py-3 text-input shadow-clay-inset outline-none placeholder:text-faint sm:py-3.5',
			error ? 'ring-2 ring-accent' : 'focus:ring-2 focus:ring-sub'
		]}
	/>
	{#if error}
		<p id="{id}-error" class="text-note font-bold text-accent">{error}</p>
	{/if}
</div>
