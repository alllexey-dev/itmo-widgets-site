import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import { onSessionLost } from '../api/client';
import { LoginPage } from '../features/auth/LoginPage';
import { sessionQueryKey } from '../features/auth/session';
import { AuditPage } from '../features/audit/AuditPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { HomePage } from '../features/home/HomePage';
import { ModerationPage } from '../features/moderation/ModerationPage';
import { RestrictionsPage } from '../features/moderation/RestrictionsPage';
import { SportPage } from '../features/system/SportPage';
import { SystemPage } from '../features/system/SystemPage';
import { UserPage } from '../features/users/UserPage';
import { UsersPage } from '../features/users/UsersPage';
import { NotFoundPage } from './NotFoundPage';
import { RequireAccess } from './RequireAccess';
import { Shell } from './Shell';

const LOGIN_PATH = '/login';

/**
 * A lost session on any request leads to the login page without a reload. The login
 * page checks the session itself, so a failed check there is not a lost session.
 */
function SessionLostRedirect() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
  useEffect(
    () =>
      onSessionLost(() => {
        if (pathnameRef.current === LOGIN_PATH) return;
        queryClient.removeQueries({ queryKey: sessionQueryKey });
        void navigate(LOGIN_PATH, { replace: true });
      }),
    [navigate, queryClient],
  );
  return null;
}

export function AppRoutes() {
  return (
    <>
      <SessionLostRedirect />
      <Routes>
        <Route path={LOGIN_PATH} element={<LoginPage />} />
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route element={<RequireAccess access="moderator" />}>
            <Route path="admin/moderation" element={<ModerationPage />} />
            <Route path="admin/restrictions" element={<RestrictionsPage />} />
          </Route>
          <Route element={<RequireAccess access="admin" />}>
            <Route path="admin/dashboard" element={<DashboardPage />} />
            <Route path="admin/users" element={<UsersPage />} />
            <Route path="admin/users/:isu" element={<UserPage />} />
            <Route path="admin/sport" element={<SportPage />} />
            <Route path="admin/system" element={<SystemPage />} />
            <Route path="admin/audit" element={<AuditPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
