import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { minutesAgo, pageOf } from '../../test/admin';
import { renderApp } from '../../test/render';
import { mockSession, ok, server, sessionOf } from '../../test/server';
import type { AuditEntry } from './AuditPage';

const entries: AuditEntry[] = Array.from({ length: 25 }, (_, index) => ({
  id: `entry-${index}`,
  action: index === 0 ? 'ROLE_GRANTED' : 'APP_VERSION_CHANGED',
  target: index === 0 ? 'user:322222' : 'app-version',
  details: index === 0 ? 'role MODERATOR' : `latest 2.${index} -> 2.${index + 1}`,
  createdAt: minutesAgo(index * 60),
  actorIsu: 400001,
  actorName: 'Анна Смирнова',
}));

function mockAudit() {
  const pages: string[] = [];
  server.use(
    http.get('*/api/admin/audit', ({ request }) => {
      pages.push(new URL(request.url).searchParams.get('page') ?? '');
      return ok(pageOf(entries, request));
    }),
  );
  return pages;
}

describe('AuditPage', () => {
  it('shows who changed what', async () => {
    mockSession(sessionOf(['ADMIN']));
    mockAudit();

    renderApp('/admin/audit');

    const table = await screen.findByRole('table', { name: 'Журнал' });
    const first = await within(table).findByRole('row', { name: /Выдана роль/ });
    expect(first).toHaveTextContent('role MODERATOR');
    expect(within(first).getByRole('link', { name: 'ИСУ 322222' })).toHaveAttribute(
      'href',
      '/admin/users/322222',
    );
    expect(within(first).getByRole('link', { name: 'Анна Смирнова' })).toBeInTheDocument();
  });

  it('pages through older entries', async () => {
    mockSession(sessionOf(['ADMIN']));
    const pages = mockAudit();
    renderApp('/admin/audit');
    expect(await screen.findByText('1–20 из 25')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Следующая страница' }));

    expect(await screen.findByText('21–25 из 25')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(6);
    expect(pages).toEqual(['0', '1']);
  });
});
