<script lang="ts">
	import './layout.css';
	import AppHeader from '$lib/common/components/AppHeader.svelte';
	import BottomNav from '$lib/common/components/BottomNav.svelte';
	import { page } from '$app/state';
	import { install } from '$lib/install/install.svelte';
	import { push } from '$lib/push/push.svelte';

	let { children } = $props();

	// どの画面から開いても受け取れるように、ここで待ち始める
	$effect(() => install.listen());

	/*
	 * ログインが変わったら、この端末の宛先の持ち主も揃え直す。
	 * user は読み込み直すたびに作り直されるので、id が変わったときだけ動かす。
	 * 送れなくても画面は止めない。次に開いたときにまた送る
	 */
	let userId = $derived(page.data.user?.id ?? null);
	$effect(() => {
		push.sync(userId !== null).catch(() => {});
	});
</script>

<AppHeader />
<!-- ページ末尾の余白はここで持つ。狭い画面では下部ナビの高さも含める -->
<div class="pb-28 lg:pb-16">
	{@render children()}
</div>
<BottomNav />
