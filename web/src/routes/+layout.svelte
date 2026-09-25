<script lang="ts">
	import './layout.css';
	import AppHeader from '$lib/common/components/AppHeader.svelte';
	import BottomNav from '$lib/common/components/BottomNav.svelte';
	import { install } from '$lib/install/install.svelte';

	let { children } = $props();

	// どの画面から開いても受け取れるように、ここで待ち始める
	$effect(() => install.listen());
</script>

<AppHeader />
<!-- ページ末尾の余白はここで持つ。狭い画面では下部ナビの高さも含める -->
<div class="pb-28 lg:pb-16">
	{@render children()}
</div>
<BottomNav />
