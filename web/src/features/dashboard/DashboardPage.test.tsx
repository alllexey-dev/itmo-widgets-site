import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { mockSession, ok, server, sessionOf } from '../../test/server';
import type { Dashboard, DashboardDay } from './types';

function daysOf(value: (index: number) => number): DashboardDay[] {
  return Array.from({ length: 30 }, (_, index) => ({
    date: `2026-09-${String(index + 1).padStart(2, '0')}`,
    newUsers: value(index),
    activeDevices: value(index) * 2,
    createdLinks: value(index),
  }));
}

function dashboardOf(days: DashboardDay[]): Dashboard {
  return {
    totals: {
      users: 1250,
      newUsers7d: 42,
      activeDevices7d: 610,
      activeDevices30d: 900,
      webSessions7d: 7,
      friendships: 380,
      links: { PRIVATE: 20, PENDING: 3, PUBLISHED: 150, REJECTED: 9, HIDDEN: 2 },
      openCases: 5,
      activeAutoSignEntries: 11,
      activeFreeSignEntries: 4,
    },
    days,
  };
}

function mockDashboard(dashboard: Dashboard) {
  server.use(http.get('*/api/admin/dashboard', () => ok(dashboard)));
}

describe('DashboardPage', () => {
  it('shows the totals with a way to the open cases', async () => {
    mockSession(sessionOf(['ADMIN']));
    mockDashboard(dashboardOf(daysOf(() => 1)));

    renderApp('/admin/dashboard');

    const users = await screen.findByRole('group', { name: 'Пользователи' });
    expect(users).toHaveTextContent(/1\s250/);
    expect(users).toHaveTextContent('+42 за 7 дней');
    expect(screen.getByRole('group', { name: 'Активные устройства' })).toHaveTextContent('610');
    expect(screen.getByRole('group', { name: 'Очереди спорта' })).toHaveTextContent('15');
    expect(screen.getByRole('link', { name: /Открытые заявки/ })).toHaveAttribute(
      'href',
      '/admin/moderation',
    );
  });

  it('draws a 30-day chart per series with its total', async () => {
    mockSession(sessionOf(['ADMIN']));
    mockDashboard(dashboardOf(daysOf((index) => index % 3)));

    renderApp('/admin/dashboard');

    const users = await screen.findByRole('region', { name: 'Новые пользователи' });
    expect(users).toHaveTextContent('30 за 30 дней');
    expect(
      within(users).getByRole('figure', { name: 'Новые пользователи по дням, всего 30' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Активные устройства' })).toHaveTextContent(
      '60 за 30 дней',
    );
  });

  it('shows links by status in words and numbers', async () => {
    mockSession(sessionOf(['ADMIN']));
    mockDashboard(dashboardOf(daysOf(() => 1)));

    renderApp('/admin/dashboard');

    const links = await screen.findByRole('region', { name: 'Ссылки по состоянию' });
    expect(links).toHaveTextContent('184 всего');
    expect(within(links).getByText('Опубликованы').parentElement).toHaveTextContent('150');
    expect(within(links).getByText('На проверке').parentElement).toHaveTextContent('3');
  });

  it('says there is nothing to draw for empty days', async () => {
    mockSession(sessionOf(['ADMIN']));
    mockDashboard(dashboardOf(daysOf(() => 0)));

    renderApp('/admin/dashboard');

    expect(await screen.findAllByText('За 30 дней ничего')).toHaveLength(3);
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
  });

  it('lists the days as a table on request', async () => {
    mockSession(sessionOf(['ADMIN']));
    mockDashboard(dashboardOf(daysOf((index) => index)));
    renderApp('/admin/dashboard');

    await userEvent.click(await screen.findByText('Данные по дням', { selector: 'summary' }));

    const table = screen.getByRole('table', { name: 'Данные по дням' });
    expect(within(table).getAllByRole('row')).toHaveLength(31);
    expect(within(table).getAllByRole('row')[1]).toHaveTextContent('29');
  });
});
