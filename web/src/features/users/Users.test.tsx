import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { minutesAgo, pageOf, restriction, userSummary } from '../../test/admin';
import { renderApp } from '../../test/render';
import { fail, mockSession, ok, server, sessionOf } from '../../test/server';
import type { AdminUserDetail, AdminUserItem } from './types';

const anna: AdminUserItem = {
  isu: 311111,
  name: 'Иван Петров',
  pictureUrl: null,
  groups: [{ name: 'M3205', course: 2, facultyShortName: 'ФИТиП' }],
  roles: ['MODERATOR'],
  createdAt: minutesAgo(60 * 24 * 30),
};
const oleg: AdminUserItem = {
  isu: 322222,
  name: 'Олег Сидоров',
  pictureUrl: null,
  groups: [{ name: 'P3212', course: 2, facultyShortName: 'ФПИиКТ' }],
  roles: [],
  createdAt: minutesAgo(60),
};

function detailOf(item: AdminUserItem, overrides: Partial<AdminUserDetail> = {}): AdminUserDetail {
  return {
    user: userSummary({ isu: item.isu, name: item.name, groups: item.groups }),
    roles: item.roles,
    groups: [...item.groups, { name: 'M3105', course: 1, facultyShortName: 'ФИТиП' }],
    createdAt: item.createdAt,
    devices: [{ name: 'Pixel 8', lastLogin: minutesAgo(90) }],
    friendsCount: 12,
    linksCount: 5,
    restrictions: [restriction({ user: userSummary({ isu: item.isu, name: item.name }) })],
    lastSeen: minutesAgo(15),
    ...overrides,
  };
}

/** Searches like the backend (ISU prefix, name or group) and applies role changes. */
function mockUsers(
  users: AdminUserItem[],
  details: AdminUserDetail[] = users.map((user) => detailOf(user)),
) {
  const queries: string[] = [];
  const roleCalls: { method: string; isu: string; csrf: string | null }[] = [];
  const state = new Map(details.map((detail) => [String(detail.user.isu), detail]));
  server.use(
    http.get('*/api/admin/users', ({ request }) => {
      const query = new URL(request.url).searchParams.get('query') ?? '';
      queries.push(query);
      const needle = query.toLowerCase();
      const matching = users.filter(
        (user) =>
          String(user.isu).startsWith(query) ||
          user.name.toLowerCase().includes(needle) ||
          user.groups.some((group) => group.name.toLowerCase().includes(needle)),
      );
      return ok(pageOf(matching, request));
    }),
    http.get('*/api/admin/users/:isu', ({ params }) => {
      const detail = state.get(String(params.isu));
      return detail ? ok(detail) : fail(404, 'not_found');
    }),
    http.all('*/api/admin/users/:isu/roles/MODERATOR', ({ params, request }) => {
      const isu = String(params.isu);
      roleCalls.push({ method: request.method, isu, csrf: request.headers.get('X-Web-Request') });
      const detail = state.get(isu);
      if (!detail) return fail(404, 'not_found');
      const roles = request.method === 'PUT' ? ['MODERATOR'] : [];
      state.set(isu, { ...detail, roles });
      return ok(roles);
    }),
  );
  return { queries, roleCalls };
}

describe('UsersPage', () => {
  it('lists users with their group and roles', async () => {
    mockSession(sessionOf(['ADMIN']));
    mockUsers([anna, oleg]);

    renderApp('/admin/users');

    const table = await screen.findByRole('table', { name: 'Пользователи' });
    const row = await within(table).findByRole('row', { name: /Иван Петров/ });
    expect(row).toHaveTextContent('311111');
    expect(row).toHaveTextContent('M3205');
    expect(row).toHaveTextContent('Модератор');
    expect(screen.getByText('2 пользователя')).toBeInTheDocument();
  });

  it('searches once the typing stops', async () => {
    mockSession(sessionOf(['ADMIN']));
    const { queries } = mockUsers([anna, oleg]);
    renderApp('/admin/users');
    await screen.findByRole('row', { name: /Олег Сидоров/ });

    await userEvent.type(screen.getByRole('textbox', { name: 'Поиск' }), 'P32');

    await waitFor(() =>
      expect(screen.queryByRole('row', { name: /Иван Петров/ })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('row', { name: /Олег Сидоров/ })).toBeInTheDocument();
    expect(queries).toEqual(['', 'P32']);
  });

  it('opens the user card from the list', async () => {
    mockSession(sessionOf(['ADMIN']));
    mockUsers([anna, oleg]);
    renderApp('/admin/users');

    await userEvent.click(await screen.findByRole('row', { name: /Иван Петров/ }));

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Иван Петров' }),
    ).toBeInTheDocument();
  });
});

describe('UserPage', () => {
  it('shows devices, counters, groups and restrictions', async () => {
    mockSession(sessionOf(['ADMIN']));
    mockUsers([anna]);

    renderApp('/admin/users/311111');

    const profile = await screen.findByRole('region', { name: 'Иван Петров' });
    expect(profile).toHaveTextContent('ИСУ 311111 · M3205 · 2 курс · ФИТиП');
    expect(screen.getByRole('table', { name: 'Устройства' })).toHaveTextContent('Pixel 8');
    expect(screen.getByRole('group', { name: 'Друзья' })).toHaveTextContent('12');
    expect(screen.getByRole('region', { name: 'Группы' })).toHaveTextContent('M3105');
    expect(screen.getByRole('table', { name: 'Ограничения пользователя' })).toHaveTextContent(
      'Публикация ссылок',
    );
  });

  it('makes a user a moderator after confirmation', async () => {
    mockSession(sessionOf(['ADMIN']));
    const { roleCalls } = mockUsers([oleg]);
    renderApp('/admin/users/322222');

    const moderator = await screen.findByRole('switch', { name: 'Модератор' });
    expect(moderator).not.toBeChecked();
    await userEvent.click(moderator);
    await userEvent.click(
      within(screen.getByRole('dialog', { name: 'Назначить модератором?' })).getByRole('button', {
        name: 'Назначить',
      }),
    );

    expect(await screen.findByText('Олег Сидоров теперь модератор')).toBeInTheDocument();
    expect(roleCalls).toEqual([{ method: 'PUT', isu: '322222', csrf: '1' }]);
    expect(screen.getByRole('switch', { name: 'Модератор' })).toBeChecked();
  });

  it('takes the moderator role away after confirmation', async () => {
    mockSession(sessionOf(['ADMIN']));
    const { roleCalls } = mockUsers([anna]);
    renderApp('/admin/users/311111');

    await userEvent.click(await screen.findByRole('switch', { name: 'Модератор' }));
    const dialog = screen.getByRole('dialog', { name: 'Снять роль модератора?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Снять роль' }));

    expect(await screen.findByText('Роль модератора снята')).toBeInTheDocument();
    expect(roleCalls).toEqual([{ method: 'DELETE', isu: '311111', csrf: '1' }]);
    expect(screen.getByRole('switch', { name: 'Модератор' })).not.toBeChecked();
  });

  it('keeps the switch on and locked for an admin', async () => {
    mockSession(sessionOf(['ADMIN']));
    mockUsers([{ ...oleg, roles: ['ADMIN'] }]);

    renderApp('/admin/users/322222');

    const moderator = await screen.findByRole('switch', { name: 'Модератор' });
    expect(moderator).toBeChecked();
    expect(moderator).toBeDisabled();
  });

  it('says when the user does not exist', async () => {
    mockSession(sessionOf(['ADMIN']));
    mockUsers([]);

    renderApp('/admin/users/999999');

    expect(await screen.findByText('Пользователь не найден')).toBeInTheDocument();
  });
});
