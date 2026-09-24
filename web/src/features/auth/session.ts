import { api, SESSION_PATH } from '../../api/client';

export type Role = 'MODERATOR' | 'ADMIN';

/** `GroupData` from itmo-widgets-core. */
export interface SessionGroup {
  name: string;
  course: number;
  facultyShortName: string;
}

/** `GET /api/web/auth/me`. */
export interface Session {
  isu: number;
  name: string;
  pictureUrl: string | null;
  groups: SessionGroup[];
  roles: Role[];
}

/** What a section requires: any signed-in user, a moderator or the admin. */
export type Access = 'user' | 'moderator' | 'admin';

export function hasAccess(session: Session, access: Access): boolean {
  const isAdmin = session.roles.includes('ADMIN');
  switch (access) {
    case 'user':
      return true;
    case 'moderator':
      return isAdmin || session.roles.includes('MODERATOR');
    case 'admin':
      return isAdmin;
  }
}

export function displayName(session: Session): string {
  return session.name.trim() || `ИСУ ${session.isu}`;
}

export const sessionQueryKey = ['session'] as const;

export function fetchSession(signal?: AbortSignal): Promise<Session> {
  return api.get<Session>(SESSION_PATH, { signal });
}

export async function logout(): Promise<void> {
  await api.post<unknown>('/api/web/auth/logout');
}
