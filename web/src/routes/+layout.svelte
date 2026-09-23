<script lang="ts">
	import './layout.css';
	import AppHeader from '$lib/common/components/AppHeader.svelte';
	import BottomNav from '$lib/common/components/BottomNav.svelte';

	let { children } = $props();
</script>

<AppHeader />
<!-- ページ末尾の余白はここで持つ。狭い画面では下部ナビの高さも含める -->
<div class="pb-28 lg:pb-16">
	{@render children()}
</div>
<BottomNav />
