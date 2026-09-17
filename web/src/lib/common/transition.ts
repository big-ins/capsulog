import { backOut, cubicIn } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

type Options = {
	duration?: number;
	/*
	 * 開くときは伸びきる手前で行き過ぎて戻る。
	 * 閉じるときは弾ませない。高さは 0 より下へ行けず、行き過ぎた分が見えない。
	 * 押した瞬間から縮める。始めに溜めを作ると、反応が遅れて感じる
	 */
	opening?: boolean;
};

/**
 * 高さを変えながら薄くする。
 * 高さだけ動かすと、縮みきる瞬間まで中身が濃いまま残り、途切れて見える
 */
export function fold(
	node: Element,
	{ duration = 300, opening = true }: Options = {}
): TransitionConfig {
	const style = getComputedStyle(node);
	const height = parseFloat(style.height);
	const paddingTop = parseFloat(style.paddingTop);
	const paddingBottom = parseFloat(style.paddingBottom);
	const marginTop = parseFloat(style.marginTop);
	const marginBottom = parseFloat(style.marginBottom);

	return {
		duration,
		easing: opening ? backOut : cubicIn,
		css: (t) => `
			overflow: hidden;
			height: ${t * height}px;
			padding-top: ${t * paddingTop}px;
			padding-bottom: ${t * paddingBottom}px;
			margin-top: ${t * marginTop}px;
			margin-bottom: ${t * marginBottom}px;
			opacity: ${Math.min(t * 2.5, 1)};
		`
	};
}
