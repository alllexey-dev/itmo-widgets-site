import type { RestrictionCapability } from '../../api/admin';
import type { BadgeTone } from '../../ui';
import type {
  CaseReason,
  CaseStatus,
  LinkCategory,
  LinkVisibility,
  ModerationAction,
  ReportReason,
} from './types';

interface Labelled {
  label: string;
  icon: string;
}

/** Names and Material Symbols as in the Android app (`SubjectLinkTexts.kt`). */
export const CATEGORIES: Record<LinkCategory, Labelled> = {
  SCORES: { label: 'Таблица баллов', icon: 'table' },
  QUEUE: { label: 'Очередь на сдачу', icon: 'format_list_numbered' },
  MATERIALS: { label: 'Материалы курса', icon: 'folder' },
  TASKS: { label: 'Задания', icon: 'assignment' },
  RECORDINGS: { label: 'Записи лекций', icon: 'videocam' },
  NOTES: { label: 'Конспекты', icon: 'edit_note' },
  EXAM: { label: 'К экзамену', icon: 'school' },
  CHAT: { label: 'Чат', icon: 'chat' },
  OTHER: { label: 'Другое', icon: 'link' },
};

export const REASONS: Record<CaseReason, Labelled & { tone: BadgeTone }> = {
  SUBMISSION: { label: 'Проверка', icon: 'fact_check', tone: 'info' },
  REPORTS: { label: 'Жалобы', icon: 'flag', tone: 'warning' },
  VOTES: { label: 'Голоса', icon: 'thumb_down', tone: 'warning' },
};

export const CASE_STATUSES: Record<CaseStatus, { label: string; tone: BadgeTone }> = {
  OPEN: { label: 'Открыта', tone: 'info' },
  RESOLVED: { label: 'Решена', tone: 'success' },
  WITHDRAWN: { label: 'Снята', tone: 'neutral' },
};

export const REPORT_REASONS: Record<ReportReason, string> = {
  BROKEN: 'Не открывается',
  WRONG_SUBJECT: 'Другой предмет',
  SPAM: 'Спам',
  OTHER: 'Другое',
};

export const ACTIONS: Record<ModerationAction, Labelled & { done: string }> = {
  APPROVE: { label: 'Одобрено', icon: 'check_circle', done: 'Ссылка одобрена' },
  REJECT: { label: 'Отклонено', icon: 'cancel', done: 'Ссылка отклонена' },
  HIDE: { label: 'Скрыто', icon: 'visibility_off', done: 'Ссылка скрыта' },
  RESTORE: { label: 'Возвращено', icon: 'visibility', done: 'Ссылка снова видна' },
  DISMISS: { label: 'Отклонены жалобы', icon: 'flag', done: 'Жалобы отклонены' },
  RESTRICT_USER: { label: 'Ограничение автора', icon: 'block', done: 'Автор ограничен' },
  HIDE_ALL_BY_USER: {
    label: 'Скрыто всё у автора',
    icon: 'hide_source',
    done: 'Ссылки автора скрыты',
  },
};

export const CAPABILITIES: Record<RestrictionCapability, string> = {
  SUBMIT_RESOURCES: 'Публикация ссылок',
  VOTE: 'Голосование',
  REPORT: 'Жалобы',
  WRITE_REVIEWS: 'Отзывы',
  ALL: 'Все действия',
};

export function visibilityLabel(visibility: LinkVisibility, audienceLabel: string | null): string {
  switch (visibility) {
    case 'PRIVATE':
      return 'Только автор';
    case 'FLOW':
      return audienceLabel ?? 'Поток из расписания';
    case 'ALL':
      return 'Все';
  }
}

/** `2026-1` → «2026/27, осень»; `2025-2` → «2025/26, весна». */
export function periodLabel(periodKey: string): string {
  const match = /^(\d{4})-([12])$/.exec(periodKey);
  if (!match) return periodKey;
  const start = Number(match[1]);
  const season = match[2] === '1' ? 'осень' : 'весна';
  return `${start}/${String(start + 1).slice(-2)}, ${season}`;
}

/** The host without `www.`, or null for something that is not a URL. */
export function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
