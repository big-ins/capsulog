<script lang="ts">
	import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';

	let { ...restProps }: SonnerProps = $props();

	/*
	 * 下からの距離。狭い画面では下部ナビの上に出す。
	 * ナビが消える幅と、ライブラリが携帯と見なす幅は違う。
	 * 両方に同じ変数を渡し、切り替えはこちらの幅で行う
	 */
	const BOTTOM = { bottom: 'var(--toast-bottom)' };
</script>

<!--
  色は自前のトークンで付けるので、既定の見た目は外す。
  既定は明暗の2通りしか持たず、data-theme のテーマに追従しない
-->
<Sonner
	position="bottom-center"
	offset={BOTTOM}
	mobileOffset={BOTTOM}
	class="[--toast-bottom:calc(env(safe-area-inset-bottom)+5.5rem)] lg:[--toast-bottom:1.25rem]"
	toastOptions={{
		unstyled: true,
		classes: {
			toast:
				'w-full rounded-2xl bg-ink px-4 py-3 text-body leading-relaxed font-bold text-surface shadow-clay-fixed',
			title: 'whitespace-pre-line'
		}
	}}
	{...restProps}
/>
