/**
 * Shapes shared by the admin API (`/api/admin/**`, backend `docs/contracts/admin.md`).
 * Section-specific shapes live next to their feature.
 */

/** `AdminPage<T>`: [page] is zero-based, [total] counts every matching item. */
export interface AdminPage<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export const DEFAULT_PAGE_SIZE = 20;

/** `GroupData` from itmo-widgets-core. */
export interface GroupData {
  name: string;
  course: number;
  facultyShortName: string;
}

/** `AdminUserSummary`: stored identity; list groups come from the ID token. */
export interface AdminUserSummary {
  isu: number;
  name: string;
  pictureUrl: string | null;
  groups: GroupData[];
}

export type RestrictionCapability =
  'SUBMIT_RESOURCES' | 'VOTE' | 'REPORT' | 'WRITE_REVIEWS' | 'ALL';

/** `AdminRestriction`. */
export interface AdminRestriction {
  id: string;
  user: AdminUserSummary;
  capability: RestrictionCapability;
  reason: string;
  startsAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedByIsu: number | null;
  active: boolean;
  /** The case whose `RESTRICT_USER` decision created the restriction. */
  caseId: string;
}
