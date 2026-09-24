import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router';
import { onSessionLost } from '../api/client';
import { LoginPage } from '../features/auth/LoginPage';
import { sessionQueryKey } from '../features/auth/session';
import { HomePage } from '../features/home/HomePage';
import { NotFoundPage } from './NotFoundPage';
import { PlaceholderPage } from './PlaceholderPage';
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
          <Route path="admin/moderation" element={<PlaceholderPage path="/admin/moderation" />} />
          <Route
            path="admin/restrictions"
            element={<PlaceholderPage path="/admin/restrictions" />}
          />
          <Route path="admin/dashboard" element={<PlaceholderPage path="/admin/dashboard" />} />
          <Route path="admin/users" element={<PlaceholderPage path="/admin/users" />} />
          <Route path="admin/sport" element={<PlaceholderPage path="/admin/sport" />} />
          <Route path="admin/system" element={<PlaceholderPage path="/admin/system" />} />
          <Route path="admin/audit" element={<PlaceholderPage path="/admin/audit" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
