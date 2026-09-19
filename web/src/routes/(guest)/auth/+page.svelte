<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import CalendarClock from '@lucide/svelte/icons/calendar-clock';
	import Heart from '@lucide/svelte/icons/heart';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import { fold } from '$lib/common/transition';
	import { authClient } from '$lib/auth/client';
	import { errorMessage, OFFLINE_MESSAGE, type AuthMode } from '$lib/auth/form';
	import { signInSchema, signUpSchema } from '$lib/auth/schemas';
	import { parseForm, type FieldErrors } from '$lib/common/form';
	import AuthField from '$lib/auth/components/AuthField.svelte';
	import GoogleButton from '$lib/auth/components/GoogleButton.svelte';
	import SubmitError from '$lib/auth/components/SubmitError.svelte';

	let { data } = $props();

	const OPEN = { duration: 300, opening: true };
	const CLOSE = { duration: 200, opening: false };

	/*
	 * 画面に出しているモード。URL とは別に持つ。
	 * URL はボタンを押した瞬間に変わるが、閉じる動きはそのあと 200ms 続く。
	 * 文言を URL に直結させると、欄が閉じきる前に切り替わり、
	 * もう要らないものが居座って見える
	 */
	let shown = $state<AuthMode>(untrack(() => data.mode));
	let isSignUp = $derived(shown === 'signup');

	/* 切り替えの最中。閉じ終わるまで URL の変化を画面に入れない */
	let switching = $state(false);

	/* 外から来たときと、戻るで移ったときは、動かさずに合わせる */
	$effect(() => {
		const incoming = data.mode;
		if (!untrack(() => switching)) shown = incoming;
	});

	let form = $state({ name: '', email: '', password: '' });
	let errors = $state<FieldErrors<typeof form>>({});
	let submitError = $state('');
	let busy = $state(false);
	let sentTo = $state('');

	const COPY = {
		login: {
			title: 'ログイン',
			social: 'Google でログイン',
			submit: 'ログイン',
			working: '確認しています',
			alt: 'はじめての方はこちら',
			altMode: 'signup'
		},
		signup: {
			title: 'カプセログをはじめる',
			social: 'Google ではじめる',
			submit: '登録する',
			working: '登録しています',
			alt: 'アカウントをお持ちの方はこちら',
			altMode: 'login'
		}
	} as const satisfies Record<AuthMode, Record<string, string>>;

	let copy = $derived(COPY[shown]);

	/* 登録すると何ができるか。登録の前にしか見せない */
	const BENEFITS = [
		{ icon: Heart, label: 'お気に入り', note: '好きな商品をすぐ見返せる' },
		{ icon: CalendarClock, label: '発売リマインド', note: 'これから出る商品を買い逃さない' },
		{ icon: LayoutGrid, label: 'コレクション', note: '集めたものをこのひとつに' }
	];

	/*
	 * 切り替えのたびに前のモードのエラーを消す。入れたままの値は残す。
	 * 画面の文言は shown が切り替わったときに一斉に変わる。
	 * 閉じる側は動きが終わってから、開く側はすぐに切り替える
	 */
	async function switchMode(next: AuthMode) {
		if (switching) return;
		errors = {};
		submitError = '';
		switching = true;

		// 先に画面を動かす。文言も欄もここで一斉に変わる
		shown = next;
		// 動きが終わってから URL を合わせる。走っている最中に load が挟まると動きが飛ぶ
		await wait(next === 'signup' ? OPEN.duration : CLOSE.duration);

		// 履歴を汚さない。戻るで前のモードへ寄り道させない。
		// resolve() 起点でクエリを足すが、静的解析では追えない
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		await goto(`${resolve('/auth')}?mode=${next}`, {
			replaceState: true,
			noScroll: true,
			keepFocus: true
		});
		switching = false;
	}

	function wait(duration: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, duration));
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		// disabled はボタン経由にしか効かない。入力欄での Enter が素通りする
		if (busy) return;

		submitError = '';
		const result = isSignUp
			? parseForm(signUpSchema, form)
			: parseForm(signInSchema, { email: form.email, password: form.password });
		errors = result.errors;
		if (!result.ok) return;

		busy = true;
		try {
			// 認証の失敗は error に入る。例外で飛ぶのは通信が切れたとき
			const { error } = isSignUp
				? // 確認のリンクを開いた先。ここではまだログインしていない
					await authClient.signUp.email({ ...form, callbackURL: resolve('/auth/verified') })
				: await authClient.signIn.email({ email: form.email, password: form.password });

			if (error) {
				submitError = errorMessage(error.code);
				return;
			}
			if (isSignUp) {
				// 登録済みのアドレスでも同じ画面を出す。ここで分けると登録の有無が分かる
				sentTo = form.email;
				return;
			}
			// 行き先は safeRedirect() で自分のサイトに限ってある
			await goto(data.redirectTo, { invalidateAll: true });
		} catch {
			submitError = OFFLINE_MESSAGE;
		} finally {
			busy = false;
		}
	}
</script>

<svelte:head>
	<title>{copy.title} | カプセログ</title>
</svelte:head>

<div data-hero class="absolute inset-x-0 top-0 -z-10 h-17 bg-accent" aria-hidden="true"></div>

<!--
  入力欄は広げきらない。長いほど視線が横に流れ、読みにくくなる。
  見出しの上だけは画面の広さを使う。中身が横に並ぶ
-->
<main class="mx-auto flex w-full max-w-sm flex-col gap-5 px-4 pt-24 pb-16 sm:max-w-md sm:pt-28">
	{#if sentTo}
		<h1 class="px-1 text-title font-extrabold sm:text-site">メールを送りました</h1>
		<div class="relative overflow-hidden rounded-3xl bg-surface p-5 shadow-clay sm:p-7">
			<span class="deco-circle absolute -top-4 -right-4 h-14 w-14 opacity-10" aria-hidden="true"
			></span>
			<div class="relative flex flex-col gap-3">
				<p class="text-heading font-bold break-all">{sentTo}</p>
				<p class="text-body leading-relaxed">メールのリンクから、登録を完了できます。</p>
				<p class="text-note leading-relaxed text-faint">
					メールが見つからないときは、迷惑メールに振り分けられていないか確かめてください。
					リンクの期限は24時間です。
				</p>
			</div>
		</div>
	{:else}
		<div class="flex flex-col px-1">
			{#if isSignUp}
				<!-- 登録の前にしか出さない。ログインする人はもう知っている -->
				<div in:fold={OPEN} out:fold={CLOSE}>
					<p class="pb-1.5 text-heading font-extrabold text-accent sm:text-title">
						あらゆるカプセルトイを、ひとつに。
					</p>
				</div>
			{/if}
			<h1 class="text-title font-extrabold sm:text-site">{copy.title}</h1>
			{#if isSignUp}
				<!-- 3つ横に並べると入力欄の幅では足りない。ここだけ外へ広げる -->
				<div in:fold={OPEN} out:fold={CLOSE} class="sm:-mx-24 lg:-mx-28">
					<ul class="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
						{#each BENEFITS as benefit (benefit.label)}
							<li class="flex flex-1 items-center gap-3 sm:flex-col sm:gap-2 sm:text-center">
								<span
									class="grid h-10 w-10 flex-none place-items-center rounded-full bg-surface text-accent shadow-clay-sm"
								>
									<benefit.icon size={18} aria-hidden="true" />
								</span>
								<span class="flex flex-col gap-0.5 sm:items-center">
									<span class="text-note font-extrabold">{benefit.label}</span>
									<span class="text-note leading-snug text-faint">{benefit.note}</span>
								</span>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</div>

		<!-- 入力とボタンを1枚の面に載せる。面が浮き、その上で入力欄が窪む -->
		<div class="relative overflow-hidden rounded-3xl bg-surface p-5 shadow-clay sm:p-7">
			<span class="deco-circle absolute -top-4 -right-4 h-14 w-14 opacity-10" aria-hidden="true"
			></span>
			<span class="deco-square absolute -bottom-5 -left-5 h-16 w-16 opacity-10" aria-hidden="true"
			></span>

			<div class="relative flex flex-col gap-5">
				<GoogleButton
					label={copy.social}
					redirectTo={data.redirectTo}
					bind:busy
					onfail={(message) => (submitError = message)}
				/>

				<div class="flex items-center gap-3 text-note font-bold text-faint">
					<span class="h-px flex-1 bg-faint/25"></span>
					または
					<span class="h-px flex-1 bg-faint/25"></span>
				</div>

				<form class="flex flex-col gap-4" onsubmit={submit} novalidate>
					{#if isSignUp}
						<!-- 登録のときだけ増える。開いた分だけ下の欄が押し下がる。
						     高さだけ動かすと、縮みきる瞬間まで文字が残って途切れて見える。
						     中身を薄くしながら閉じる -->
						<div in:fold={OPEN} out:fold={CLOSE}>
							<AuthField
								id="name"
								label="ニックネーム"
								type="text"
								autocomplete="username"
								bind:value={form.name}
								error={errors.name}
							/>
						</div>
					{/if}
					<AuthField
						id="email"
						label="メールアドレス"
						type="email"
						autocomplete="email"
						bind:value={form.email}
						error={errors.email}
					/>
					<AuthField
						id="password"
						label="パスワード"
						type="password"
						autocomplete={isSignUp ? 'new-password' : 'current-password'}
						placeholder={isSignUp ? '8文字以上' : undefined}
						bind:value={form.password}
						error={errors.password}
					/>

					<SubmitError message={submitError} />

					<button
						type="submit"
						disabled={busy}
						class="pressable rounded-full bg-accent py-3 text-body font-bold text-on-accent shadow-clay-pressed disabled:opacity-60 sm:py-3.5"
					>
						{busy ? copy.working : copy.submit}
					</button>
				</form>
			</div>
		</div>

		<div class="flex flex-col items-center gap-2.5">
			<button
				type="button"
				onclick={() => switchMode(copy.altMode)}
				class="text-note font-bold text-accent underline"
			>
				{copy.alt}
			</button>
			{#if !isSignUp}
				<!-- 登録のときは出さない。まだアカウントが無い -->
				<a href={resolve('/auth/reset')} class="text-note font-bold text-faint underline">
					パスワードを忘れた
				</a>
			{/if}
		</div>
	{/if}
</main>

<style>
	/* 隅の装飾。円と四角を対角に置く。散らさず、面の角だけに留める */
	.deco-circle {
		background: var(--accent);
		border-radius: 50%;
	}
	.deco-square {
		background: var(--sub);
		transform: rotate(24deg);
	}
</style>
