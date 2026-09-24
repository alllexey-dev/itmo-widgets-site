export type SportOutcome = 'SUCCESS' | 'PARTIAL' | 'FAILED';
export type SportErrorCategory =
  'AUTH' | 'NETWORK' | 'HTTP' | 'MAPPING' | 'PERSISTENCE' | 'INTERNAL';

export interface SportRun {
  id: number;
  timestamp: string;
  outcome: SportOutcome;
  durationMillis: number;
  receivedLessons: number;
  newLessonsAdded: number;
  updatedLessons: number;
  skippedLessons: number;
  errorCategory: SportErrorCategory | null;
}

/** `AdminSportStatus`: the last 50 runs, seven-day totals and live queue sizes. */
export interface SportStatus {
  runs: SportRun[];
  outcomes7d: Record<SportOutcome, number>;
  errors7d: Record<SportErrorCategory, number>;
  averageDurationMillis7d: number | null;
  lastSuccessAt: string | null;
  activeAutoSignEntries: number;
  activeFreeSignEntries: number;
}

/** `AdminAppVersion`: [overridden] once the values are stored in settings. */
export interface AppVersion {
  latest: string;
  minimum: string;
  note: string;
  overridden: boolean;
  updatedAt: string | null;
}

export interface AppVersionRequest {
  latest: string;
  minimum: string;
  note: string;
}

export interface ModerationPolicy {
  premoderation: boolean;
  reportThreshold: number;
  voteThreshold: number;
  dailySubmissionLimit: number;
  dailyReportLimit: number;
}

/** Keyed by target type; a PUT must carry every type. */
export interface ModerationSettings {
  policies: Record<string, ModerationPolicy>;
}

export const LINK_POLICY = 'SUBJECT_RESOURCE';
