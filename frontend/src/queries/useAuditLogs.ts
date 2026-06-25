import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { AuditLog, PaginatedResponse } from '../types';

export function useAuditLogs() {
  return useQuery({
    queryKey: ['audit-logs'],
    queryFn: async (): Promise<{ results: AuditLog[]; count: number; next: string | null }> => {
      const res = await apiFetch('/api/audit-logs/?page_size=200');
      if (!res.ok) throw new Error('Failed to load audit log');
      const data: PaginatedResponse<AuditLog> = await res.json();
      return data;
    },
  });
}
