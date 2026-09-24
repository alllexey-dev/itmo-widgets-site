import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminPage } from '../../api/admin';
import { api } from '../../api/client';
import type { AdminUserDetail, AdminUserItem } from './types';

const BASE = '/api/admin/users';

export const usersKey = ['admin', 'users'] as const;

export interface UserSearch {
  query: string;
  page: number;
  size: number;
}

export function useUsers(search: UserSearch) {
  return useQuery({
    queryKey: [...usersKey, 'list', search],
    queryFn: ({ signal }) =>
      api.get<AdminPage<AdminUserItem>>(BASE, {
        query: { query: search.query, page: search.page, size: search.size },
        signal,
      }),
    placeholderData: keepPreviousData,
  });
}

const userKey = (isu: number) => [...usersKey, 'detail', isu] as const;

export function useUser(isu: number) {
  return useQuery({
    queryKey: userKey(isu),
    queryFn: ({ signal }) => api.get<AdminUserDetail>(`${BASE}/${isu}`, { signal }),
  });
}

/** Grants or revokes `MODERATOR`; the backend answers with the roles afterwards. */
export function useModeratorRole(isu: number) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (moderator: boolean) => {
      const path = `${BASE}/${isu}/roles/MODERATOR`;
      return moderator ? api.put<string[]>(path) : api.delete<string[]>(path);
    },
    onSuccess: async (roles) => {
      client.setQueryData<AdminUserDetail>(userKey(isu), (current) =>
        current ? { ...current, roles } : current,
      );
      await Promise.all([
        client.invalidateQueries({ queryKey: [...usersKey, 'list'] }),
        client.invalidateQueries({ queryKey: ['admin', 'audit'] }),
      ]);
    },
  });
}
