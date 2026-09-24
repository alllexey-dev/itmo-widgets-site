import { screen, within } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { minutesAgo } from '../../test/admin';
import { renderApp } from '../../test/render';
import { mockSession, ok, server, sessionOf } from '../../test/server';
import type { SportRun, SportStatus } from './types';

function run(id: number, overrides: Partial<SportRun> = {}): SportRun {
  return {
    id,
    timestamp: minutesAgo(id * 10),
    outcome: 'SUCCESS',
    durationMillis: 2400,
    receivedLessons: 120,
    newLessonsAdded: 3,
    updatedLessons: 7,
    skippedLessons: 0,
    errorCategory: null,
    ...overrides,
  };
}

function statusOf(overrides: Partial<SportStatus> = {}): SportStatus {
  return {
    runs: [run(1, { outcome: 'FAILED', errorCategory: 'NETWORK' }), run(2)],
    outcomes7d: { SUCCESS: 40, PARTIAL: 2, FAILED: 1 },
    errors7d: { AUTH: 0, NETWORK: 1, HTTP: 2, MAPPING: 0, PERSISTENCE: 0, INTERNAL: 0 },
    averageDurationMillis7d: 2400,
    lastSuccessAt: minutesAgo(20),
    activeAutoSignEntries: 11,
    activeFreeSignEntries: 4,
    ...overrides,
  };
}

describe('SportPage', () => {
  it('shows the refresh health, queues and errors of the week', async () => {
    mockSession(sessionOf(['ADMIN']));
    server.use(http.get('*/api/admin/system/sport', () => ok(statusOf())));

    renderApp('/admin/sport');

    expect(await screen.findByText('Последний запуск упал')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Запуски за 7 дней' })).toHaveTextContent('43');
    expect(screen.getByRole('group', { name: 'Средняя длительность' })).toHaveTextContent('2,4 с');
    expect(screen.getByRole('group', { name: 'Автозапись' })).toHaveTextContent('11');
    const errors = screen.getByRole('region', { name: 'Ошибки за 7 дней' });
    expect(errors).toHaveTextContent('Сеть: 1');
    expect(errors).toHaveTextContent('Ответ сервера: 2');
    expect(errors).not.toHaveTextContent('Авторизация');
  });

  it('lists the latest runs with their outcome', async () => {
    mockSession(sessionOf(['ADMIN']));
    server.use(http.get('*/api/admin/system/sport', () => ok(statusOf())));

    renderApp('/admin/sport');

    const table = await screen.findByRole('table', { name: 'Последние запуски' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent('Сбой');
    expect(rows[1]).toHaveTextContent('Сеть');
    expect(rows[2]).toHaveTextContent('Успешно');
  });

  it('says when the catalog has never been refreshed', async () => {
    mockSession(sessionOf(['ADMIN']));
    server.use(
      http.get('*/api/admin/system/sport', () =>
        ok(statusOf({ runs: [], lastSuccessAt: null, averageDurationMillis7d: null })),
      ),
    );

    renderApp('/admin/sport');

    expect(await screen.findByText('Запусков не было')).toBeInTheDocument();
    expect(screen.getByText('Запусков ещё не было')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Последнее успешное' })).toHaveTextContent('Не было');
  });
});
