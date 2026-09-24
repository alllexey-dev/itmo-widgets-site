import type { AdminRestriction, AdminUserSummary, GroupData } from '../../api/admin';

/** `AdminUserItem`: a row of `GET /api/admin/users`. */
export interface AdminUserItem {
  isu: number;
  name: string;
  pictureUrl: string | null;
  groups: GroupData[];
  roles: string[];
  createdAt: string;
}

export interface AdminDevice {
  name: string;
  lastLogin: string;
}

/** `AdminUserDetail`: [user] has the current groups, [groups] every stored one. */
export interface AdminUserDetail {
  user: AdminUserSummary;
  roles: string[];
  groups: GroupData[];
  createdAt: string;
  devices: AdminDevice[];
  friendsCount: number;
  linksCount: number;
  restrictions: AdminRestriction[];
  lastSeen: string | null;
}
