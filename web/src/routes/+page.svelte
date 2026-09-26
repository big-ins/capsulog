<script lang="ts">
	import FlipNumber from '$lib/common/components/FlipNumber.svelte';
	import PageHeading from '$lib/common/components/PageHeading.svelte';
	import InstallNotice from '$lib/install/components/InstallNotice.svelte';
	import { install } from '$lib/install/install.svelte';
	import PushNotice from '$lib/push/components/PushNotice.svelte';
	import { push } from '$lib/push/push.svelte';

	let { data } = $props();

	/*
	 * ホーム画面から開き、通知をまだ聞いていないときだけ出す。
	 * ブラウザのままの人には、リマインドを押したときに聞く
	 */
	let asksPush = $derived(install.standalone && push.status === 'default');
</script>

<svelte:head><title>カプセログ</title></svelte:head>

<main class="mx-auto max-w-2xl px-4 pt-6 lg:max-w-5xl lg:pt-24">
	<PageHeading title="カプセログ" />

	<p class="text-body text-faint">
		{data.makerCount}社 {data.productCount.toLocaleString('ja-JP')}件のカプセルトイを掲載中！
	</p>

	<!-- 追加済みか、案内しようがない環境では出さない。追加した後は同じ場所で通知を聞く -->
	{#if install.kind}
		<div class="pt-4">
			<InstallNotice />
		</div>
	{:else if asksPush && data.vapidPublicKey}
		<div class="pt-4">
			<PushNotice publicKey={data.vapidPublicKey} />
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
