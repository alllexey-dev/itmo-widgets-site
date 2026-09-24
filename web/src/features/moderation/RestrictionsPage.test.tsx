import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import type { AdminRestriction } from '../../api/admin';
import { pageOf, restriction, userSummary } from '../../test/admin';
import { renderApp } from '../../test/render';
import { mockSession, ok, server, sessionOf } from '../../test/server';

const active = restriction();
const other = restriction({
  id: 'restriction-2',
  user: userSummary({ isu: 322222, name: 'Олег Сидоров' }),
  capability: 'VOTE',
  reason: 'Накрутка голосов',
  expiresAt: null,
});

/** Filters by `isu` and `active` like the backend and records every query. */
function mockRestrictions(all: AdminRestriction[]) {
  const requests: URLSearchParams[] = [];
  const revoked: string[] = [];
  server.use(
    http.get('*/api/admin/moderation/restrictions', ({ request }) => {
      const params = new URL(request.url).searchParams;
      requests.push(params);
      const isu = params.get('isu');
      const onlyActive = params.get('active') !== 'false';
      const matching = all.filter(
        (item) =>
          (!isu || String(item.user.isu) === isu) &&
          (!onlyActive || (item.active && !revoked.includes(item.id))),
      );
      return ok(pageOf(matching, request));
    }),
    http.post('*/api/admin/moderation/restrictions/:id/revoke', ({ params }) => {
      revoked.push(String(params.id));
      return ok(null);
    }),
  );
  return { requests, revoked };
}

describe('RestrictionsPage', () => {
  it('lists active restrictions with the capability and term', async () => {
    mockSession(sessionOf(['MODERATOR']));
    mockRestrictions([active, other]);

    renderApp('/admin/restrictions');

    const table = await screen.findByRole('table', { name: 'Ограничения' });
    const row = await within(table).findByRole('row', { name: /Олег Сидоров/ });
    expect(row).toHaveTextContent('Голосование');
    expect(row).toHaveTextContent('бессрочно');
    expect(row).toHaveTextContent('Действует');
  });

  it('finds restrictions by ISU', async () => {
    mockSession(sessionOf(['MODERATOR']));
    const { requests } = mockRestrictions([active, other]);
    renderApp('/admin/restrictions');
    await screen.findByRole('row', { name: /Олег Сидоров/ });

    await userEvent.type(screen.getByRole('textbox', { name: 'ИСУ' }), '322222');

    await waitFor(() =>
      expect(screen.queryByRole('row', { name: /Иван Петров/ })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('row', { name: /Олег Сидоров/ })).toBeInTheDocument();
    expect(requests.at(-1)?.get('isu')).toBe('322222');
  });

  it('includes ended restrictions under «Все»', async () => {
    mockSession(sessionOf(['MODERATOR']));
    const { requests } = mockRestrictions([
      active,
      restriction({ id: 'old', active: false, revokedAt: new Date().toISOString() }),
    ]);
    renderApp('/admin/restrictions');
    await screen.findByRole('row', { name: /Иван Петров/ });

    await userEvent.click(screen.getByRole('button', { name: 'Все' }));

    expect(await screen.findByText('Снято')).toBeInTheDocument();
    expect(requests.at(-1)?.get('active')).toBe('false');
  });

  it('revokes a restriction after confirmation', async () => {
    mockSession(sessionOf(['MODERATOR']));
    const { revoked } = mockRestrictions([active]);
    renderApp('/admin/restrictions');

    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Снять ограничение: Иван Петров, Публикация ссылок',
      }),
    );
    const dialog = screen.getByRole('dialog', { name: 'Снять ограничение?' });
    expect(dialog).toHaveTextContent('Иван Петров снова сможет: публикация ссылок.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Снять' }));

    expect(await screen.findByText('Ограничение снято')).toBeInTheDocument();
    expect(revoked).toEqual(['restriction-1']);
    expect(await screen.findByText('Действующих ограничений нет')).toBeInTheDocument();
  });
});
