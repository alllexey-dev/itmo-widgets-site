import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import type { AppVersion, AppVersionRequest, ModerationSettings, SportStatus } from './types';

const auditKey = ['admin', 'audit'] as const;

export function useSportStatus() {
  return useQuery({
    queryKey: ['admin', 'system', 'sport'],
    queryFn: ({ signal }) => api.get<SportStatus>('/api/admin/system/sport', { signal }),
  });
}

const appVersionKey = ['admin', 'system', 'app-version'] as const;

export function useAppVersion() {
  return useQuery({
    queryKey: appVersionKey,
    queryFn: ({ signal }) => api.get<AppVersion>('/api/admin/system/app-version', { signal }),
  });
}

export function useSaveAppVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: AppVersionRequest) =>
      api.put<AppVersion>('/api/admin/system/app-version', request),
    onSuccess: async (saved) => {
      client.setQueryData(appVersionKey, saved);
      await client.invalidateQueries({ queryKey: auditKey });
    },
  });
}

const settingsKey = ['admin', 'moderation', 'settings'] as const;

export function useModerationSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: ({ signal }) =>
      api.get<ModerationSettings>('/api/admin/moderation/settings', { signal }),
  });
}

/** Turning premoderation off approves the waiting queue, so the moderation lists refresh too. */
export function useSaveModerationSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (settings: ModerationSettings) =>
      api.put<ModerationSettings>('/api/admin/moderation/settings', settings),
    onSuccess: async (saved) => {
      client.setQueryData(settingsKey, saved);
      await Promise.all([
        client.invalidateQueries({ queryKey: ['admin', 'moderation', 'cases'] }),
        client.invalidateQueries({ queryKey: auditKey }),
      ]);
    },
  });
}
