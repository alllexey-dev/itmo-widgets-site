import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

/**
 * Open moderation cases for the home card. Until the admin API, the count is the
 * length of the moderator queue from `GET /api/moderation/cases?status=OPEN`.
 */
export function useOpenCaseCount() {
  return useQuery({
    queryKey: ['moderation', 'cases', 'OPEN'],
    queryFn: ({ signal }) =>
      api.get<unknown[]>('/api/moderation/cases', { query: { status: 'OPEN' }, signal }),
    select: (cases) => cases.length,
    retry: false,
  });
}
