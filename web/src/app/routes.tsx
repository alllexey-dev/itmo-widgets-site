import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router';
import { onSessionLost } from '../api/client';
import { LoginPage } from '../features/auth/LoginPage';
import { sessionQueryKey } from '../features/auth/session';
import { HomePage } from '../features/home/HomePage';
import { NotFoundPage } from './NotFoundPage';
import { PlaceholderPage } from './PlaceholderPage';
import { Shell } from './Shell';

/** A lost session on any request leads to the login page without a reload. */
function SessionLostRedirect() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useEffect(
    () =>
      onSessionLost(() => {
        queryClient.removeQueries({ queryKey: sessionQueryKey });
        void navigate('/login', { replace: true });
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
        <Route path="/login" element={<LoginPage />} />
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
