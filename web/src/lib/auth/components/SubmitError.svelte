<script lang="ts">
	let { message }: { message: string } = $props();
</script>

{#if message}
	<p class="rounded-2xl bg-accent/10 px-4 py-3 text-note font-bold text-accent" role="alert">
		{message}
	</p>
{/if}
