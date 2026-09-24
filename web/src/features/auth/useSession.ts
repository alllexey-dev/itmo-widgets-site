import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import { useNavigate } from 'react-router';
import { fetchSession, logout, sessionQueryKey, type Session } from './session';

export const SessionContext = createContext<Session | null>(null);

/** The signed-in user; only inside the shell, which renders pages after the session loads. */
export function useSession(): Session {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used inside the shell');
  return session;
}

/** Loads `GET /api/web/auth/me`; 401/403 there sends the browser to the login page. */
export function useSessionQuery() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: ({ signal }) => fetchSession(signal),
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      void navigate('/login', { replace: true });
    },
  });
}
