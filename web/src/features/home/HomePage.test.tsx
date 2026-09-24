import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { fail, mockOpenCases, mockSession, server, sessionOf } from '../../test/server';
import type { Role } from '../auth/session';

describe('HomePage', () => {
  it('shows the profile of the signed-in user', async () => {
    mockSession(sessionOf([], { pictureUrl: null }));

    renderApp('/');

    const profile = await screen.findByRole('region', { name: 'Анна Смирнова' });
    expect(profile).toHaveTextContent('ИСУ 400001');
    expect(profile).toHaveTextContent('P3212 · 2 курс · ФПИиКТ');
  });

  it('tells a user without roles that the web version is coming', async () => {
    mockSession(sessionOf([]));

    renderApp('/');

    expect(await screen.findByText('Веб-версия в разработке')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Открытые заявки/ })).not.toBeInTheDocument();
  });

  it.each<[string, Role[], string]>([
    ['a moderator', ['MODERATOR'], 'Модератор'],
    ['the admin', ['ADMIN'], 'Администратор'],
  ])('shows %s the open cases linking to the queue', async (_, roles, roleLabel) => {
    mockSession(sessionOf(roles));
    mockOpenCases(3);

    renderApp('/');

    const cases = await screen.findByRole('link', { name: /Открытые заявки/ });
    expect(cases).toHaveTextContent('3');
    expect(cases).toHaveAttribute('href', '/admin/moderation');
    expect(screen.getByRole('region', { name: 'Анна Смирнова' })).toHaveTextContent(roleLabel);
    expect(screen.queryByText('Веб-версия в разработке')).not.toBeInTheDocument();
  });

  it('hides the open cases quietly when the queue does not load', async () => {
    mockSession(sessionOf(['MODERATOR']));
    server.use(http.get('*/api/admin/moderation/cases', () => fail(503, 'unavailable')));
    renderApp('/');
    await screen.findByRole('region', { name: 'Анна Смирнова' });

    await waitForElementToBeRemoved(() =>
      screen.queryByRole('status', { name: 'Загружаем открытые заявки' }),
    );

    expect(screen.queryByRole('link', { name: /Открытые заявки/ })).not.toBeInTheDocument();
  });
});
