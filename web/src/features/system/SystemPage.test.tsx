import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { renderApp } from '../../test/render';
import { mockSession, ok, server, sessionOf } from '../../test/server';
import type { AppVersion, AppVersionRequest, ModerationSettings } from './types';

const version: AppVersion = {
  latest: '2.1',
  minimum: '1.9',
  note: 'Исправления',
  overridden: false,
  updatedAt: null,
};

const settings: ModerationSettings = {
  policies: {
    SUBJECT_RESOURCE: {
      premoderation: true,
      reportThreshold: 3,
      voteThreshold: -3,
      dailySubmissionLimit: 20,
      dailyReportLimit: 10,
    },
  },
};

function mockSystem() {
  const versionSaves: { body: AppVersionRequest; csrf: string | null }[] = [];
  const settingsSaves: ModerationSettings[] = [];
  let currentVersion = version;
  let currentSettings = settings;
  server.use(
    http.get('*/api/admin/system/app-version', () => ok(currentVersion)),
    http.put('*/api/admin/system/app-version', async ({ request }) => {
      const body = (await request.json()) as AppVersionRequest;
      versionSaves.push({ body, csrf: request.headers.get('X-Web-Request') });
      currentVersion = { ...body, overridden: true, updatedAt: new Date().toISOString() };
      return ok(currentVersion);
    }),
    http.get('*/api/admin/moderation/settings', () => ok(currentSettings)),
    http.put('*/api/admin/moderation/settings', async ({ request }) => {
      currentSettings = (await request.json()) as ModerationSettings;
      settingsSaves.push(currentSettings);
      return ok(currentSettings);
    }),
  );
  return { versionSaves, settingsSaves };
}

function versionCard() {
  return screen.findByRole('region', { name: 'Версия приложения' });
}

function moderationCard() {
  return screen.findByRole('region', { name: 'Модерация ссылок' });
}

describe('SystemPage', () => {
  it('saves a new app version', async () => {
    mockSession(sessionOf(['ADMIN']));
    const { versionSaves } = mockSystem();
    renderApp('/admin/system');
    const card = await versionCard();
    const latest = await within(card).findByRole('textbox', { name: 'Последняя' });
    const save = within(card).getByRole('button', { name: 'Сохранить' });
    expect(save).toBeDisabled();

    await userEvent.clear(latest);
    await userEvent.type(latest, '2.3');
    await userEvent.click(save);

    expect(await screen.findByText('Версия сохранена')).toBeInTheDocument();
    expect(versionSaves).toEqual([
      { body: { latest: '2.3', minimum: '1.9', note: 'Исправления' }, csrf: '1' },
    ]);
    expect(await within(card).findByText('Из настроек')).toBeInTheDocument();
  });

  it('does not let the minimum exceed the latest version', async () => {
    mockSession(sessionOf(['ADMIN']));
    const { versionSaves } = mockSystem();
    renderApp('/admin/system');
    const card = await versionCard();
    const minimum = await within(card).findByRole('textbox', { name: 'Минимальная' });

    await userEvent.clear(minimum);
    await userEvent.type(minimum, '3.0');

    expect(minimum).toHaveAccessibleDescription('Не выше последней');
    expect(within(card).getByRole('button', { name: 'Сохранить' })).toBeDisabled();
    expect(versionSaves).toHaveLength(0);
  });

  it('turns premoderation off only after confirmation', async () => {
    mockSession(sessionOf(['ADMIN']));
    const { settingsSaves } = mockSystem();
    renderApp('/admin/system');
    const card = await moderationCard();

    await userEvent.click(await within(card).findByRole('switch', { name: 'Премодерация' }));
    await userEvent.click(within(card).getByRole('button', { name: 'Сохранить' }));
    const dialog = screen.getByRole('dialog', { name: 'Выключить премодерацию?' });
    expect(settingsSaves).toHaveLength(0);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Выключить' }));

    expect(await screen.findByText('Правила сохранены')).toBeInTheDocument();
    expect(settingsSaves[0]?.policies.SUBJECT_RESOURCE).toEqual({
      ...settings.policies.SUBJECT_RESOURCE,
      premoderation: false,
    });
    expect(within(card).getByRole('switch', { name: 'Премодерация' })).not.toBeChecked();
  });

  it('saves thresholds without asking', async () => {
    mockSession(sessionOf(['ADMIN']));
    const { settingsSaves } = mockSystem();
    renderApp('/admin/system');
    const card = await moderationCard();
    const reports = await within(card).findByRole('textbox', { name: 'Жалоб до проверки' });

    await userEvent.clear(reports);
    await userEvent.type(reports, '5');
    await userEvent.click(within(card).getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(settingsSaves).toHaveLength(1));
    expect(settingsSaves[0]?.policies.SUBJECT_RESOURCE?.reportThreshold).toBe(5);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('rejects a positive vote threshold', async () => {
    mockSession(sessionOf(['ADMIN']));
    mockSystem();
    renderApp('/admin/system');
    const card = await moderationCard();
    const votes = await within(card).findByRole('textbox', { name: 'Рейтинг для проверки' });

    await userEvent.clear(votes);
    await userEvent.type(votes, '2');

    expect(votes).toHaveAccessibleDescription('Не больше −1');
    expect(within(card).getByRole('button', { name: 'Сохранить' })).toBeDisabled();
  });
});
