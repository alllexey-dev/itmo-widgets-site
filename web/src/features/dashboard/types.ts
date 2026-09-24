import type { LinkStatus } from '../moderation/types';

/** `AdminDashboardTotals`: rolling windows end now. */
export interface DashboardTotals {
  users: number;
  newUsers7d: number;
  activeDevices7d: number;
  activeDevices30d: number;
  webSessions7d: number;
  friendships: number;
  links: Record<LinkStatus, number>;
  openCases: number;
  activeAutoSignEntries: number;
  activeFreeSignEntries: number;
}

/** One Moscow day; `date` is `YYYY-MM-DD`. */
export interface DashboardDay {
  date: string;
  newUsers: number;
  activeDevices: number;
  createdLinks: number;
}

/** `AdminDashboard`: [days] holds 30 zero-filled days, oldest first. */
export interface Dashboard {
  totals: DashboardTotals;
  days: DashboardDay[];
}

export type DayMetric = Exclude<keyof DashboardDay, 'date'>;
