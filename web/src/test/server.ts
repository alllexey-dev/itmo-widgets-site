import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { LoginChallenge, LoginStatus } from '../features/auth/login';
import type { Session } from '../features/auth/session';

export const server = setupServer();

/** Wraps data the way the backend `ApiResponse` does. */
export function ok<T>(data: T) {
  return HttpResponse.json({ success: true, data, error: null });
}

export function fail(status: number, code: string, message = 'Ошибка') {
  return HttpResponse.json({ success: false, data: null, error: { message, code } }, { status });
}

export function sessionOf(roles: Session['roles'], overrides: Partial<Session> = {}): Session {
  return {
    isu: 400001,
    name: 'Анна Смирнова',
    pictureUrl: null,
    groups: [{ name: 'P3212', course: 2, facultyShortName: 'ФПИиКТ' }],
    roles,
    ...overrides,
  };
}

export function mockSession(session: Session) {
  server.use(http.get('*/api/web/auth/me', () => ok(session)));
}

/** A visitor without a session: `/me` answers 403 as the backend does. */
export function mockSignedOut() {
  server.use(http.get('*/api/web/auth/me', () => fail(403, 'forbidden')));
}

/** A code that lives 2 minutes from the moment the backend answers. */
export function challengeOf(code: string): LoginChallenge {
  return {
    id: `challenge-${code}`,
    code,
    pollSecret: `secret-${code}`,
    expiresAt: new Date(Date.now() + 120_000).toISOString(),
  };
}

/** Each POST hands out the next code; the last one repeats. */
export function mockChallenges(...codes: string[]) {
  let created = 0;
  server.use(
    http.post('*/api/web/auth/challenges', () => {
      const code = codes[Math.min(created, codes.length - 1)] ?? 'ABCDEFGH';
      created += 1;
      return ok(challengeOf(code));
    }),
  );
}

/** Answers polls with [status] for the code; a wrong poll secret gets 404 like the backend. */
export function mockPoll(status: (code: string) => LoginStatus = () => 'PENDING') {
  server.use(
    http.get('*/api/web/auth/challenges/:id', ({ params, request }) => {
      const code = String(params.id).replace('challenge-', '');
      if (request.headers.get('X-Poll-Secret') !== `secret-${code}`) return fail(404, 'not_found');
      return ok({ status: status(code) });
    }),
  );
}

/** The open-case count behind the home card: a one-item page with [count] as the total. */
export function mockOpenCases(count: number) {
  server.use(
    http.get('*/api/admin/moderation/cases', () =>
      ok({ items: [], page: 0, size: 1, total: count }),
    ),
  );
}
