/**
 * Thin `fetch` wrapper for our `/api/**`. The browser is authenticated by the
 * httpOnly `iw_session` cookie on the same origin; changing requests carry
 * `X-Web-Request: 1`, which the backend requires for cookie sessions (CSRF).
 * Every backend response is an `ApiResponse` envelope that is unwrapped here.
 */

/** `dev.alllexey.itmowidgets.core.model.ApiResponse` from itmo-widgets-core. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  error: { message: string; code: string | null } | null;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: HttpMethod;
  /** Serialized as JSON. */
  body?: unknown;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export const SESSION_PATH = '/api/web/auth/me';

/** Error codes produced by the client itself rather than by the backend. */
export const CLIENT_ERROR_CODES = {
  network: 'network',
  http: 'http_error',
} as const;

export class ApiError extends Error {
  readonly status: number;
  /** Backend `ApiResponse.error.code`, e.g. `not_found`, `rate_limited`, `csrf`. */
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }
}

type SessionLostListener = () => void;
const sessionLostListeners = new Set<SessionLostListener>();

/** The app routes to the login page; without a listener the page reloads there. */
export function onSessionLost(listener: SessionLostListener): () => void {
  sessionLostListeners.add(listener);
  return () => {
    sessionLostListeners.delete(listener);
  };
}

function notifySessionLost(): void {
  if (sessionLostListeners.size > 0) {
    sessionLostListeners.forEach((listener) => listener());
    return;
  }
  const loginPath = `${import.meta.env.BASE_URL}login`;
  if (!window.location.pathname.startsWith(loginPath)) window.location.assign(loginPath);
}

function isSessionLost(path: string, status: number): boolean {
  return status === 401 || (status === 403 && path === SESSION_PATH);
}

function buildUrl(path: string, query?: Record<string, QueryValue>): URL {
  const url = new URL(path, window.location.origin);
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url;
}

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { success?: unknown }).success === 'boolean'
  );
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers };
  if (method !== 'GET') headers['X-Web-Request'] = '1';
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      credentials: 'same-origin',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;
    throw new ApiError('Нет соединения с сервером', 0, CLIENT_ERROR_CODES.network);
  }

  const payload = await readJson(response);

  if (!response.ok || (isEnvelope(payload) && !payload.success)) {
    if (isSessionLost(path, response.status)) notifySessionLost();
    const error = isEnvelope(payload) ? payload.error : null;
    throw new ApiError(
      error?.message ?? `HTTP ${response.status}`,
      response.status,
      error?.code ?? CLIENT_ERROR_CODES.http,
    );
  }

  return (isEnvelope(payload) ? payload.data : payload) as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
