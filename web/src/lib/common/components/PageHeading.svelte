<script lang="ts">
	let { title }: { title: string } = $props();
</script>

<!--
  ページ名。狭い画面ではヘッダが出ないため、ここが画面の名前を示す唯一の場所になる。
  広い画面ではヘッダのナビが選択中の項目を示すので、重ねて出さない
-->
<h1 class="pb-4 text-title font-extrabold lg:hidden">{title}</h1>
