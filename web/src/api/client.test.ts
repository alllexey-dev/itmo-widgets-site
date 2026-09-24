import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fail, ok, server } from '../test/server';
import { api, ApiError, onSessionLost } from './client';

describe('api client', () => {
  let unsubscribe: (() => void) | undefined;
  afterEach(() => unsubscribe?.());

  it('unwraps the ApiResponse envelope and sends query parameters', async () => {
    let url: URL | undefined;
    server.use(
      http.get('*/api/admin/users', ({ request }) => {
        url = new URL(request.url);
        return ok({ items: [1, 2] });
      }),
    );

    const data = await api.get<{ items: number[] }>('/api/admin/users', {
      query: { query: 'P3212', page: 0, empty: '' },
    });

    expect(data).toEqual({ items: [1, 2] });
    expect(url?.searchParams.get('query')).toBe('P3212');
    expect(url?.searchParams.get('page')).toBe('0');
    expect(url?.searchParams.has('empty')).toBe(false);
  });

  it('marks changing requests with X-Web-Request and sends JSON', async () => {
    let headers: Headers | undefined;
    let body: unknown;
    server.use(
      http.put('*/api/admin/system/app-version', async ({ request }) => {
        headers = request.headers;
        body = await request.json();
        return ok(null);
      }),
    );

    await api.put('/api/admin/system/app-version', { latest: '2.2' });

    expect(headers?.get('X-Web-Request')).toBe('1');
    expect(headers?.get('Content-Type')).toBe('application/json');
    expect(body).toEqual({ latest: '2.2' });
  });

  it('does not mark GET requests', async () => {
    let headers: Headers | undefined;
    server.use(
      http.get('*/api/admin/audit', ({ request }) => {
        headers = request.headers;
        return ok([]);
      }),
    );

    await api.get('/api/admin/audit');

    expect(headers?.has('X-Web-Request')).toBe(false);
  });

  it('throws ApiError with the backend code', async () => {
    server.use(
      http.post('*/api/web/auth/challenges', () => fail(429, 'rate_limited', 'Слишком часто')),
    );

    const error = await api.post('/api/web/auth/challenges').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 429, code: 'rate_limited', message: 'Слишком часто' });
  });

  it('reports a lost session on 403 from /me', async () => {
    const listener = vi.fn();
    unsubscribe = onSessionLost(listener);
    server.use(http.get('*/api/web/auth/me', () => fail(403, 'access_denied')));

    await expect(api.get('/api/web/auth/me')).rejects.toBeInstanceOf(ApiError);

    expect(listener).toHaveBeenCalledOnce();
  });

  it('keeps the session on 403 from other endpoints', async () => {
    const listener = vi.fn();
    unsubscribe = onSessionLost(listener);
    server.use(http.get('*/api/admin/dashboard', () => fail(403, 'permission_denied')));

    await expect(api.get('/api/admin/dashboard')).rejects.toMatchObject({ status: 403 });

    expect(listener).not.toHaveBeenCalled();
  });

  it('turns a failed connection into a network ApiError', async () => {
    server.use(http.get('*/api/admin/audit', () => HttpResponse.error()));

    await expect(api.get('/api/admin/audit')).rejects.toMatchObject({ status: 0, code: 'network' });
  });
});
