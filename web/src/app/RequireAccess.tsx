import { Outlet } from 'react-router';
import type { Access } from '../features/auth/session';
import { useAccess } from '../features/auth/useSession';
import { ForbiddenPage } from './ForbiddenPage';

/** Renders nested routes for users with [access]; others get «Нет доступа» and no requests. */
export function RequireAccess({ access }: { access: Exclude<Access, 'user'> }) {
  return useAccess(access) ? <Outlet /> : <ForbiddenPage access={access} />;
}
