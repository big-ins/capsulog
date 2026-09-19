<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import AppHeader from '$lib/common/components/AppHeader.svelte';
	import BottomNav from '$lib/common/components/BottomNav.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<AppHeader />
<!-- 下部ナビの分だけ下に余白を足す。最後の中身がナビの裏に隠れないようにする -->
<div class="pb-28 lg:pb-0">
	{@render children()}
</div>
<BottomNav />
