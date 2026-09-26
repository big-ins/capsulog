<script lang="ts">
	import FlipNumber from '$lib/common/components/FlipNumber.svelte';
	import PageHeading from '$lib/common/components/PageHeading.svelte';
	import InstallNotice from '$lib/install/components/InstallNotice.svelte';
	import { install } from '$lib/install/install.svelte';
	import PushNotice from '$lib/push/components/PushNotice.svelte';
	import { push } from '$lib/push/push.svelte';

	let { data } = $props();

	/*
	 * 通知をまだ聞いていない間は、開くたびに出す。リマインドを押したときには聞かない。
	 * iPhone で追加していなければ通知は使えない状態になり、ここには出ない
	 */
	let asksPush = $derived(push.status === 'default' && !!data.vapidPublicKey);
</script>

<svelte:head><title>カプセログ</title></svelte:head>

<main class="mx-auto max-w-2xl px-4 pt-6 lg:max-w-5xl lg:pt-24">
	<PageHeading title="カプセログ" />

	<p class="text-body text-faint">
		{data.makerCount}社 {data.productCount.toLocaleString('ja-JP')}件のカプセルトイを掲載中！
	</p>

	<!-- お知らせ。当てはまるものを並べる。Android と PC は追加と通知の両方が出ることがある -->
	{#if install.kind || asksPush}
		<div class="flex flex-col gap-2 pt-4">
			{#if install.kind}
				<InstallNotice />
			{/if}
			{#if asksPush && data.vapidPublicKey}
				<PushNotice publicKey={data.vapidPublicKey} />
			{/if}
		</div>
	{/if}

	<div class="flex flex-col gap-1 pt-6">
		<p class="text-body font-bold text-faint">コレクション</p>
		<p class="flex items-baseline gap-1 text-accent">
			<span class="text-count font-extrabold">
				<FlipNumber value={data.collectionCount} />
			</span>
			<span class="text-title font-extrabold text-ink">件</span>
		</p>
	</div>
</main>
