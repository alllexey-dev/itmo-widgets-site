import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
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
