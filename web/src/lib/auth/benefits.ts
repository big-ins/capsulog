import CalendarClock from '@lucide/svelte/icons/calendar-clock';
import Heart from '@lucide/svelte/icons/heart';
import LayoutGrid from '@lucide/svelte/icons/layout-grid';
import type { Component } from 'svelte';

/* 登録すると何ができるか。登録へ誘う画面はどこも同じことを言う */
export const BENEFITS: { icon: Component; label: string; note: string }[] = [
	{ icon: Heart, label: 'お気に入り', note: '好きな商品をすぐ見返せる' },
	{ icon: CalendarClock, label: '発売リマインド', note: 'これから出る商品を買い逃さない' },
	{ icon: LayoutGrid, label: 'コレクション', note: '集めたものをこのひとつに' }
];
