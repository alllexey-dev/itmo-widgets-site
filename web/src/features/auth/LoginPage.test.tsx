import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderApp } from '../../test/render';
import {
  challengeOf,
  fail,
  mockChallenges,
  mockPoll,
  mockSession,
  mockSignedOut,
  ok,
  server,
  sessionOf,
} from '../../test/server';

function setTabHidden(hidden: boolean) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  });
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

afterEach(() => {
  Reflect.deleteProperty(document, 'visibilityState');
  vi.useRealTimers();
});

describe('LoginPage', () => {
  it('shows the QR, the code in groups of four and the time left', async () => {
    mockSignedOut();
    mockChallenges('ABCDEFGH');
    mockPoll();

    renderApp('/login');

    expect(await screen.findByText('ABCD EFGH')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'QR-код для входа' })).toBeInTheDocument();
    expect(
      screen.getByText('Откройте ITMO.Widgets → Профиль → Вход на сайт и отсканируйте QR'),
    ).toBeInTheDocument();
    expect(screen.getByText('2:00')).toBeInTheDocument();
  });

  it('waits for the app and goes home once the login is approved', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    let signedIn = false;
    let polls = 0;
    server.use(
      http.get('*/api/web/auth/me', () => (signedIn ? ok(sessionOf([])) : fail(403, 'forbidden'))),
    );
    mockChallenges('ABCDEFGH');
    mockPoll(() => {
      polls += 1;
      if (polls < 2) return 'PENDING';
      signedIn = true;
      return 'APPROVED';
    });
    renderApp('/login');
    expect(await screen.findByText('Ждём подтверждения в приложении')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(2_000);

    expect(await screen.findByRole('heading', { name: 'Главная' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Анна Смирнова' })).toBeInTheDocument();
  });

  it('shows a new code when the backend reports the old one expired', async () => {
    mockSignedOut();
    mockChallenges('ABCDEFGH', 'KMNPQRST');
    mockPoll((code) => (code === 'ABCDEFGH' ? 'EXPIRED' : 'PENDING'));

    renderApp('/login');

    expect(await screen.findByText('KMNP QRST')).toBeInTheDocument();
    expect(screen.queryByText('ABCD EFGH')).not.toBeInTheDocument();
  });

  it('shows a new code when the countdown ends', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSignedOut();
    mockChallenges('ABCDEFGH', 'KMNPQRST');
    mockPoll();
    renderApp('/login');
    expect(await screen.findByText('ABCD EFGH')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(120_000);

    expect(await screen.findByText('KMNP QRST')).toBeInTheDocument();
  });

  it('asks to wait when too many codes were requested and retries on demand', async () => {
    mockSignedOut();
    let attempts = 0;
    server.use(
      http.post('*/api/web/auth/challenges', () => {
        attempts += 1;
        return attempts === 1
          ? fail(429, 'rate_limited', 'Too many login codes, try again later')
          : ok(challengeOf('ABCDEFGH'));
      }),
    );
    mockPoll();
    renderApp('/login');

    await userEvent.click(await screen.findByRole('button', { name: 'Повторить' }));

    expect(await screen.findByText('ABCD EFGH')).toBeInTheDocument();
    expect(
      screen.queryByText('Слишком много попыток, подождите пару минут'),
    ).not.toBeInTheDocument();
  });

  it('explains the rate limit in plain words', async () => {
    mockSignedOut();
    server.use(http.post('*/api/web/auth/challenges', () => fail(429, 'rate_limited')));

    renderApp('/login');

    expect(
      await screen.findByText('Слишком много попыток, подождите пару минут'),
    ).toBeInTheDocument();
  });

  it('pauses polling while the tab is hidden and polls again on return', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockSignedOut();
    mockChallenges('ABCDEFGH');
    let polls = 0;
    mockPoll(() => {
      polls += 1;
      return 'PENDING';
    });
    renderApp('/login');
    await waitFor(() => expect(polls).toBe(1));

    setTabHidden(true);
    await vi.advanceTimersByTimeAsync(10_000);
    const pollsWhileHidden = polls;
    setTabHidden(false);

    expect(pollsWhileHidden).toBe(1);
    await waitFor(() => expect(polls).toBe(2));
  });

  it('sends a signed-in user home', async () => {
    mockSession(sessionOf([]));

    renderApp('/login');

    expect(await screen.findByRole('heading', { name: 'Главная' })).toBeInTheDocument();
  });

  it('asks to open a code scanned by a phone camera in the app', async () => {
    mockSignedOut();
    let created = 0;
    server.use(
      http.post('*/api/web/auth/challenges', () => {
        created += 1;
        return ok(challengeOf('KMNPQRST'));
      }),
    );
    mockPoll();
    renderApp('/login?code=abcdefgh');

    expect(
      await screen.findByText('Откройте этот код в приложении ITMO.Widgets'),
    ).toBeInTheDocument();
    expect(screen.getByText('ABCD EFGH')).toBeInTheDocument();
    expect(created).toBe(0);

    await userEvent.click(
      screen.getByRole('button', { name: 'Войти в браузере на этом устройстве' }),
    );

    expect(await screen.findByText('KMNP QRST')).toBeInTheDocument();
  });
});
