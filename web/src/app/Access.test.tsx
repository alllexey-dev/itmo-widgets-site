import { screen, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Role } from '../features/auth/session';
import { mockModeration, moderationCase } from '../test/admin';
import { renderApp } from '../test/render';
import { mockSession, ok, server, sessionOf } from '../test/server';

const MODERATOR_PATHS = ['/admin/moderation', '/admin/restrictions'];
const ADMIN_PATHS = [
  '/admin/dashboard',
  '/admin/users',
  '/admin/users/311111',
  '/admin/sport',
  '/admin/system',
  '/admin/audit',
];

const emptyPage = { items: [], page: 0, size: 20, total: 0 };

describe('Access by role', () => {
  it.each(MODERATOR_PATHS)('closes %s to a user without roles', async (path) => {
    mockSession(sessionOf([]));

    renderApp(path);

    expect(await screen.findByText('Нет доступа')).toBeInTheDocument();
    expect(screen.getByText('Этот раздел доступен только модераторам.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute('href', '/');
  });

  it.each(ADMIN_PATHS)('closes %s to a moderator', async (path) => {
    mockSession(sessionOf(['MODERATOR']));

    renderApp(path);

    expect(await screen.findByText('Нет доступа')).toBeInTheDocument();
    expect(screen.getByText('Этот раздел доступен только администратору.')).toBeInTheDocument();
  });

  it('opens the restrictions to a moderator', async () => {
    mockSession(sessionOf(['MODERATOR']));
    server.use(http.get('*/api/admin/moderation/restrictions', () => ok(emptyPage)));

    renderApp('/admin/restrictions');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Ограничения' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Нет доступа')).not.toBeInTheDocument();
  });

  it('opens the audit to the admin', async () => {
    mockSession(sessionOf(['ADMIN']));
    server.use(http.get('*/api/admin/audit', () => ok(emptyPage)));

    renderApp('/admin/audit');

    expect(await screen.findByText('Записей пока нет')).toBeInTheDocument();
    expect(screen.queryByText('Нет доступа')).not.toBeInTheDocument();
  });

  it.each<[string, Role[], boolean]>([
    ['hides the author profile from a moderator', ['MODERATOR'], false],
    ['links the author profile for the admin', ['ADMIN'], true],
  ])('%s', async (_, roles, visible) => {
    mockSession(sessionOf(roles));
    mockModeration([moderationCase({ id: 'case-1', title: 'Баллы' })]);

    renderApp('/admin/moderation');

    const author = await screen.findByRole('region', { name: 'Автор' });
    expect(within(author).queryByRole('link', { name: 'Профиль' }) !== null).toBe(visible);
  });
});
