import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { Dashboard } from './types';

export function useDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: ({ signal }) => api.get<Dashboard>('/api/admin/dashboard', { signal }),
    staleTime: 60_000,
  });
}
