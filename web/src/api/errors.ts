import { ApiError, CLIENT_ERROR_CODES } from './client';

const MESSAGES: Record<string, string> = {
  [CLIENT_ERROR_CODES.network]: 'Нет соединения с сервером',
  permission_denied: 'Недостаточно прав',
  not_found: 'Не найдено',
  rate_limited: 'Слишком много запросов, попробуйте позже',
  csrf: 'Обновите страницу и попробуйте снова',
};

/**
 * A short Russian message for a failed request. Backend messages are English and
 * technical, so only known codes are translated; [overrides] refine them per action.
 */
export function errorText(
  error: unknown,
  fallback: string,
  overrides: Partial<Record<string, string>> = {},
): string {
  if (!(error instanceof ApiError)) return fallback;
  return overrides[error.code] ?? MESSAGES[error.code] ?? fallback;
}
