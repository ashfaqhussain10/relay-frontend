import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Session, Message, PaginatedResponse } from '../types';

export function useSessions(tenantId: number) {
  return useQuery({
    queryKey: ['sessions', tenantId],
    queryFn: async (): Promise<Session[]> => {
      const res = await apiFetch(`/api/sessions/?tenant=${tenantId}&page_size=200`);
      if (!res.ok) throw new Error('Failed to load conversations');
      const data: PaginatedResponse<Session> = await res.json();
      return data.results;
    },
    enabled: tenantId > 0,
  });
}

export function useMessages(sessionId: number | null) {
  return useQuery({
    queryKey: ['messages', sessionId],
    queryFn: async (): Promise<Message[]> => {
      const res = await apiFetch(`/api/messages/?session=${sessionId}&page_size=200`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data: PaginatedResponse<Message> = await res.json();
      return data.results;
    },
    enabled: sessionId !== null && sessionId > 0,
  });
}
