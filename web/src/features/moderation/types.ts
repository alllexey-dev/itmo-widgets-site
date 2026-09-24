import type { AdminUserSummary, GroupData, RestrictionCapability } from '../../api/admin';

/** Moderation shapes from backend `docs/contracts/admin.md` and `subject-links.md`. */

export type CaseStatus = 'OPEN' | 'RESOLVED' | 'WITHDRAWN';
export type CaseReason = 'SUBMISSION' | 'REPORTS' | 'VOTES';
export type LinkCategory =
  'SCORES' | 'QUEUE' | 'MATERIALS' | 'TASKS' | 'RECORDINGS' | 'NOTES' | 'EXAM' | 'CHAT' | 'OTHER';
export type LinkVisibility = 'PRIVATE' | 'FLOW' | 'ALL';
export type RevisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
export type LinkStatus = 'PRIVATE' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'HIDDEN';
export type ReportReason = 'BROKEN' | 'WRONG_SUBJECT' | 'SPAM' | 'OTHER';
export type ModerationAction =
  'APPROVE' | 'REJECT' | 'HIDE' | 'RESTORE' | 'DISMISS' | 'RESTRICT_USER' | 'HIDE_ALL_BY_USER';

/** Immutable submitted content with its review outcome. */
export interface SubjectLinkRevision {
  id: string;
  linkId: string;
  number: number;
  category: LinkCategory;
  url: string;
  title: string | null;
  visibility: LinkVisibility;
  flowId: number | null;
  status: RevisionStatus;
  submittedAt: string;
  decidedAt: string | null;
  note: string | null;
}

export interface AdminLinkSummary {
  id: string;
  subjectId: number;
  subjectName: string;
  periodKey: string;
  score: number;
  hidden: boolean;
}

/** A queue row; revision, link and author are null when the target was deleted. */
export interface AdminCaseItem {
  id: string;
  targetType: 'SUBJECT_RESOURCE';
  status: CaseStatus;
  reason: CaseReason;
  openedAt: string;
  resolvedAt: string | null;
  revision: SubjectLinkRevision | null;
  link: AdminLinkSummary | null;
  author: AdminUserSummary | null;
  reportCount: number;
}

export interface UserData {
  isu: number;
  name: string;
  pictureUrl: string | null;
  groups: GroupData[];
}

/** The content other students currently see, with the owner-side status. */
export interface SubjectLink {
  id: string;
  subjectId: number;
  subjectName: string;
  periodKey: string;
  category: LinkCategory;
  url: string;
  title: string | null;
  visibility: LinkVisibility;
  flowId: number | null;
  /** The schedule name of a FLOW link's flow, e.g. «ФИЗ ПИИКТ 3.2.1». */
  audienceLabel: string | null;
  status: LinkStatus;
  reviewNote: string | null;
  score: number;
  updatedAt: string;
}

export interface ModerationReport {
  reason: ReportReason;
  comment: string | null;
  createdAt: string;
}

export interface UserRestriction {
  id: string;
  capability: RestrictionCapability;
  reason: string;
  startsAt: string;
  expiresAt: string | null;
}

export interface SubmitterHistory {
  approved: number;
  rejected: number;
  dismissedReports: number;
  activeRestrictions: UserRestriction[];
}

export interface SubjectLinkTarget {
  targetType: 'SUBJECT_RESOURCE';
  revision: SubjectLinkRevision;
  link: SubjectLink;
  author: UserData;
  reports: ModerationReport[];
  submitterHistory: SubmitterHistory;
}

export interface RestrictionRequest {
  capability: RestrictionCapability;
  /** Null restricts without an end date. */
  days: number | null;
}

export interface ModerationDecision {
  id: string;
  moderatorId: string | null;
  action: ModerationAction;
  note: string | null;
  restriction: RestrictionRequest | null;
  createdAt: string;
  /** `POLICY` decisions are made by the rules, e.g. a flow link approved at once. */
  actor: 'MODERATOR' | 'POLICY';
}

export interface ModerationCase {
  id: string;
  targetType: 'SUBJECT_RESOURCE';
  status: CaseStatus;
  reason: CaseReason;
  openedAt: string;
  /** Null when the link was deleted. */
  target: SubjectLinkTarget | null;
  decisions: ModerationDecision[];
}

export interface DecisionRequest {
  action: ModerationAction;
  note?: string;
  restriction?: { capability: RestrictionCapability; days?: number };
}
