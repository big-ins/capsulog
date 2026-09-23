<script lang="ts">
	import { untrack } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Bell from '@lucide/svelte/icons/bell';
	import Heart from '@lucide/svelte/icons/heart';
	import SignUpDialog from '$lib/auth/components/SignUpDialog.svelte';

	let {
		productId,
		favorited,
		remind,
		remindable
	}: {
		productId: number;
		favorited: number;
		remind: number;
		/* 発売を知らせる余地があるか。発売済みと発売月不明では false になる */
		remindable: boolean;
	} = $props();

	let loggedIn = $derived(!!page.data.user);

	/*
	 * 画面に出している状態。押した瞬間に切り替え、サーバの往復は待たない。
	 * $derived にすると、押した直後の代入が load のやり直しで戻ってしまう
	 */
	let on = $state({ favorited: !!untrack(() => favorited), remind: !!untrack(() => remind) });

	/*
	 * まだサーバへ送り終えていない項目。送信中に押された分もここに入る。
	 * 送るまでに間があり、その間に別の操作の invalidateAll が返ってくることがある。
	 * 載っている値は、こちらの操作より前のものなので当てにできない
	 */
	let pending = $state<Record<string, boolean>>({});

	/* サーバが持っている値に合わせ直す。送信待ちの項目は、こちらの値を優先して残す */
	$effect(() => {
		const next = { favorited: !!favorited, remind: !!remind };
		on = {
			favorited: pending.favorited ? untrack(() => on.favorited) : next.favorited,
			remind: pending.remind ? untrack(() => on.remind) : next.remind
		};
	});

	let dialogOpen = $state(false);
	let dialogFeature = $state('');

	/* 付いているときの色。役割ごとに変え、並んでいても見分けられるようにする */
	const BUTTONS = [
		{
			kind: 'favorited',
			icon: Heart,
			label: 'お気に入り',
			color: 'text-accent',
			ring: 'border-accent'
		},
		{
			kind: 'remind',
			icon: Bell,
			label: '発売リマインド',
			color: 'text-alert',
			ring: 'border-alert'
		}
	] as const;

	type Kind = (typeof BUTTONS)[number]['kind'];

	/*
	 * 発売済みにリマインドは出さない。知らせる先が過ぎている。
	 * ただし既に付いているものは残す。消すと外す手段がなくなる。
	 * 発売済みになった分は、リマインドの配信を作るときに日次で落とす
	 */
	let shown = $derived(
		BUTTONS.filter((button) => button.kind !== 'remind' || remindable || on.remind)
	);

	/* 弾ける輪。項目ごとに持ち、押されたものだけを鳴らす */
	let rings = $state<Record<string, HTMLElement>>({});

	/*
	 * 飛び散る粒。8方向へ等間隔に置く。
	 * 飛距離は揃える。1つおきに変えると、8点が四角の輪郭に並んでしまう。
	 * ばらつきは大きさで出す
	 */
	const SPARKS = Array.from({ length: 8 }, (_, index) => ({
		angle: `${index * 45}deg`,
		size: index % 2 === 0 ? '5px' : '3.5px'
	}));

	/*
	 * いま動かしている項目。走り終えたら外し、次に押したときまた掛かるようにする。
	 * 跳ねは付け外しの両方で出すが、輪と粒は付けたときだけなので別に持つ
	 */
	let popping = $state<Record<string, boolean>>({});
	let bursting = $state<Record<string, boolean>>({});

	/*
	 * 弾けが終わるまでの長さ。最後の粒の遅れを含める。
	 * animationend だと粒ごとに8回来るので、時間で一度だけ片付ける
	 */
	const BURST_MS = 400;
	let burstTimers: Record<string, ReturnType<typeof setTimeout>> = {};

	/*
	 * 送るまでの待ち時間。この間に押し直されたら、前の予約を取り消して測り直す。
	 * 連打しても送るのは最後の状態だけになる
	 */
	const SEND_DELAY_MS = 400;
	let timers: Record<string, ReturnType<typeof setTimeout>> = {};

	/** 押されたら見た目を切り替え、少し待ってからその時点の値を送る */
	function toggle(kind: Kind) {
		play(kind, !on[kind]);
		on[kind] = !on[kind];
		pending[kind] = true;

		clearTimeout(timers[kind]);
		timers[kind] = setTimeout(() => send(kind), SEND_DELAY_MS);
	}

	/*
	 * いまの値をサーバへ送る。切り替えではなく値を渡すので、重なっても結果が同じになる。
	 * 一覧の読み進めた分を保つため、載せ替えは invalidateAll に任せる。
	 *
	 * 送っている間に押されたら、送信待ちの印を降ろさない。
	 * 降ろすと、返ってきた古い値でその操作が消える
	 */
	async function send(kind: Kind) {
		const sent = on[kind];

		const body = new FormData();
		body.set('productId', String(productId));
		body.set('kind', kind);
		body.set('value', sent ? '1' : '0');
		await fetch('?/setState', { method: 'POST', body });
		await invalidateAll();

		if (on[kind] === sent) pending[kind] = false;
	}

	/** 登録していない人にはダイアログで先に何があるかを見せる */
	function askToSignUp(label: string) {
		dialogFeature = label;
		dialogOpen = true;
	}

	/*
	 * 押した瞬間の動き。アイコンの跳ねは付け外しのどちらでも出す。
	 * 外すのも操作であり、手応えが要る。
	 *
	 * 輪と粒は付けたときだけ。取り消しは祝う場面ではなく、色が消えることで足りる。
	 * 輪は線を太いところから細くしながら広げる。塗りつぶすとアイコンを覆ってしまう。
	 *
	 * クラスは一度外してから次のフレームで付ける。
	 * 同じ項目を続けて押しても掛け直せるようにするため
	 */
	function play(kind: Kind, turningOn: boolean) {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		popping[kind] = false;
		bursting[kind] = false;
		requestAnimationFrame(() => {
			popping[kind] = true;
			bursting[kind] = turningOn;
		});
		clearTimeout(burstTimers[kind]);
		burstTimers[kind] = setTimeout(() => {
			popping[kind] = false;
			bursting[kind] = false;
		}, BURST_MS);

		if (!turningOn) return;

		rings[kind]?.animate(
			[
				{ transform: 'scale(0.2)', borderWidth: '14px', opacity: 1 },
				{ transform: 'scale(1.5)', borderWidth: '2px', opacity: 0.7, offset: 0.5 },
				{ transform: 'scale(1.9)', borderWidth: '0px', opacity: 0 }
			],
			{ duration: 260, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)' }
		);
	}
</script>

<!--
  当たり判定はアイコンより広く取る。外すとカードのリンクが反応して詳細へ飛んでしまう。
  見た目の大きさはアイコンが決め、押せる範囲だけを広げる。
  沈む動きは影を持つ面に付ける。透明な当たり判定を沈めても何も動いて見えない
-->
<div class="flex items-center">
	{#each shown as button (button.kind)}
		{@const Icon = button.icon}
		<button
			type="button"
			aria-label={button.label}
			aria-pressed={loggedIn ? on[button.kind] : undefined}
			onclick={() => (loggedIn ? toggle(button.kind) : askToSignUp(button.label))}
			class="grid h-11 w-11 place-items-center"
		>
			<span
				class={[
					'pressable relative grid h-9 w-9 place-items-center rounded-full bg-surface shadow-clay-sm transition-colors',
					loggedIn && on[button.kind] ? button.color : 'text-faint',
					bursting[button.kind] && 'state-burst'
				]}
			>
				<!-- 弾ける輪。付けた瞬間だけ走らせるので、既定では見えない -->
				<span
					bind:this={rings[button.kind]}
					class={['absolute inset-0 rounded-full border-0 opacity-0', button.ring]}
					aria-hidden="true"
				></span>
				<!-- 飛び散る粒。中心に重ねて置き、角度の向きへ飛ばす -->
				{#each SPARKS as spark, index (spark.angle)}
					<span
						class="state-spark"
						style="--angle: {spark.angle}; --size: {spark.size}; --order: {index}"
						aria-hidden="true"
					></span>
				{/each}
				<span class={popping[button.kind] ? 'state-pop' : undefined}>
					<Icon
						size={18}
						fill={loggedIn && on[button.kind] ? 'currentColor' : 'none'}
						aria-hidden="true"
					/>
				</span>
			</span>
		</button>
	{/each}
</div>

<SignUpDialog bind:open={dialogOpen} feature={dialogFeature} />
