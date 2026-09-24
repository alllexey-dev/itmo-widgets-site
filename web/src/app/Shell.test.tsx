import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Role } from '../features/auth/session';
import { renderApp } from '../test/render';
import {
  fail,
  mockChallenges,
  mockOpenCases,
  mockPoll,
  mockSession,
  server,
  ok,
  sessionOf,
} from '../test/server';

const MODERATOR_LINKS = ['Модерация', 'Ограничения'];
const ADMIN_LINKS = ['Дашборд', 'Пользователи', 'Спорт', 'Система', 'Журнал'];

async function navLinks() {
  const nav = await screen.findByRole('navigation', { name: 'Разделы' });
  await within(nav).findByRole('link', { name: 'Главная' });
  return within(nav)
    .getAllByRole('link')
    .map((link) => link.lastElementChild?.textContent);
}

describe('Shell navigation', () => {
  it.each<[string, Role[], string[]]>([
    ['a user', [], ['Главная']],
    ['a moderator', ['MODERATOR'], ['Главная', ...MODERATOR_LINKS]],
    ['the admin', ['ADMIN'], ['Главная', ...MODERATOR_LINKS, ...ADMIN_LINKS]],
  ])('shows %s only their sections', async (_, roles, expected) => {
    mockSession(sessionOf(roles));
    mockOpenCases(0);

    renderApp('/');

    expect(await navLinks()).toEqual(expected);
  });

  it('marks the current section and renders its page', async () => {
    mockSession(sessionOf(['ADMIN']));
    server.use(http.get('*/api/admin/users', () => ok({ items: [], page: 0, size: 20, total: 0 })));

    renderApp('/admin/users');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Пользователи' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Пользователи' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('shows the not found page for an unknown path', async () => {
    mockSession(sessionOf([]));

    renderApp('/nope');

    expect(await screen.findByText('Страница не найдена')).toBeInTheDocument();
  });

  it('sends a visitor without a session to the login page', async () => {
    server.use(http.get('*/api/web/auth/me', () => fail(401, 'unauthorized')));
    mockChallenges('ABCDEFGH');
    mockPoll();

    renderApp('/admin/moderation');

    expect(await screen.findByRole('heading', { name: 'Вход' })).toBeInTheDocument();
    expect(await screen.findByText('ABCD EFGH')).toBeInTheDocument();
  });

  it('logs out from the account menu and returns to the login page', async () => {
    let loggedOut = false;
    server.use(
      http.get('*/api/web/auth/me', () =>
        loggedOut ? fail(403, 'forbidden') : ok(sessionOf(['MODERATOR'])),
      ),
      http.post('*/api/web/auth/logout', ({ request }) => {
        loggedOut = request.headers.get('X-Web-Request') === '1';
        return HttpResponse.json({ success: true, data: null, error: null });
      }),
    );
    mockOpenCases(0);
    mockChallenges('ABCDEFGH');
    mockPoll();
    renderApp('/');

    await userEvent.click(await screen.findByRole('button', { name: 'Аккаунт: Анна Смирнова' }));
    await userEvent.click(screen.getByRole('menuitem', { name: 'Выйти' }));

    expect(await screen.findByRole('img', { name: 'QR-код для входа' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Вход' })).toBeInTheDocument();
    expect(loggedOut).toBe(true);
  });

  it('switches and remembers the theme', async () => {
    mockSession(sessionOf([]));
    renderApp('/');

    await userEvent.click(await screen.findByRole('button', { name: 'Аккаунт: Анна Смирнова' }));
    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Тёмная' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('iw-theme')).toBe('dark');
    expect(screen.getByRole('menuitemradio', { name: 'Тёмная' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
