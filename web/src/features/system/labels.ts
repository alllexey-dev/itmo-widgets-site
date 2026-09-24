import type { BadgeTone } from '../../ui';
import type { SportErrorCategory, SportOutcome } from './types';

export const OUTCOMES: Record<SportOutcome, { label: string; tone: BadgeTone; icon: string }> = {
  SUCCESS: { label: 'Успешно', tone: 'success', icon: 'check_circle' },
  PARTIAL: { label: 'Частично', tone: 'warning', icon: 'warning' },
  FAILED: { label: 'Сбой', tone: 'error', icon: 'error' },
};

export const ERROR_CATEGORIES: Record<SportErrorCategory, string> = {
  AUTH: 'Авторизация',
  NETWORK: 'Сеть',
  HTTP: 'Ответ сервера',
  MAPPING: 'Разбор данных',
  PERSISTENCE: 'База данных',
  INTERNAL: 'Внутренняя ошибка',
};
