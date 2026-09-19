import { resolve } from '$app/paths';
import House from '@lucide/svelte/icons/house';
import CalendarDays from '@lucide/svelte/icons/calendar-days';
import LayoutGrid from '@lucide/svelte/icons/layout-grid';
import CircleUserRound from '@lucide/svelte/icons/circle-user-round';
import type { Component } from 'svelte';

/* href を持たないものは準備中。押せない状態で並べる */
export type NavItem = {
	label: string;
	href?: string;
	icon: Component;
};

export const NAV_ITEMS: NavItem[] = [
	{ label: 'ホーム', href: resolve('/'), icon: House },
	{ label: 'カレンダー', href: resolve('/calendar'), icon: CalendarDays },
	{ label: 'コレクション', icon: LayoutGrid },
	{ label: 'マイページ', href: resolve('/mypage'), icon: CircleUserRound }
];

/**
 * いまその項目を見ているか。
 * ホームは全てのパスの前方一致になるため、完全一致で判定する
 */
export function isCurrent(item: NavItem, pathname: string): boolean {
	if (!item.href) return false;
	if (item.href === '/') return pathname === '/';
	return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
