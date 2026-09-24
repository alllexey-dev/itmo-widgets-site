import { hasAccess, type Access, type Session } from '../features/auth/session';

export interface NavItem {
  path: string;
  label: string;
  icon: string;
  access: Access;
}

/** Sidebar groups, top to bottom; a group without visible items is hidden. */
export const NAV_GROUPS: readonly (readonly NavItem[])[] = [
  [{ path: '/', label: 'Главная', icon: 'home', access: 'user' }],
  [
    { path: '/admin/moderation', label: 'Модерация', icon: 'gavel', access: 'moderator' },
    { path: '/admin/restrictions', label: 'Ограничения', icon: 'block', access: 'moderator' },
  ],
  [
    { path: '/admin/dashboard', label: 'Дашборд', icon: 'monitoring', access: 'admin' },
    { path: '/admin/users', label: 'Пользователи', icon: 'group', access: 'admin' },
    { path: '/admin/sport', label: 'Спорт', icon: 'fitness_center', access: 'admin' },
    { path: '/admin/system', label: 'Система', icon: 'settings', access: 'admin' },
    { path: '/admin/audit', label: 'Журнал', icon: 'history', access: 'admin' },
  ],
];

export function visibleNavGroups(session: Session): NavItem[][] {
  return NAV_GROUPS.map((group) => group.filter((item) => hasAccess(session, item.access))).filter(
    (group) => group.length > 0,
  );
}
