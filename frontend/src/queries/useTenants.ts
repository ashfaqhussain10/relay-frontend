import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { Tenant, PaginatedResponse } from '../types';

export const tenantKeys = {
  all: ['tenants'] as const,
  detail: (id: number) => ['tenants', id] as const,
};

export function useTenants() {
  return useQuery({
    queryKey: tenantKeys.all,
    queryFn: async (): Promise<Tenant[]> => {
      const res = await apiFetch('/api/tenants/?page_size=200');
      if (!res.ok) throw new Error('Failed to load clients');
      const data: PaginatedResponse<Tenant> = await res.json();
      return data.results;
    },
  });
}

export function useTenant(id: number) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: tenantKeys.detail(id),
    queryFn: async (): Promise<Tenant> => {
      const res = await apiFetch(`/api/tenants/${id}/`);
      if (!res.ok) throw new Error('Client not found');
      return res.json();
    },
    initialData: () => {
      const list = qc.getQueryData<Tenant[]>(tenantKeys.all);
      return list?.find(t => t.id === id);
    },
  });
}

export function useCreateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Omit<Tenant, 'id' | 'created_at'>>): Promise<Tenant> => {
      const res = await apiFetch('/api/tenants/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const first = Object.values(body)[0];
        throw new Error(Array.isArray(first) ? first[0] : body.detail ?? 'Failed to create client');
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: tenantKeys.all }),
  });
}

export function usePatchTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: number } & Partial<Omit<Tenant, 'id' | 'created_at'>>): Promise<Tenant> => {
      const res = await apiFetch(`/api/tenants/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const first = Object.values(body)[0];
        throw new Error(Array.isArray(first) ? first[0] : body.detail ?? 'Failed to save changes');
      }
      return res.json();
    },
    onSuccess: (updated) => {
      qc.setQueryData(tenantKeys.detail(updated.id), updated);
      qc.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

export function useActivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`/api/tenants/${id}/activate/`, { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw body;
      return body;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: tenantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

export function useDeactivateTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`/api/tenants/${id}/deactivate/`, { method: 'POST' });
      if (!res.ok) throw new Error('Deactivation failed');
      return res.json().catch(() => ({}));
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: tenantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

export function useDeleteTenant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch(`/api/tenants/${id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete client');
    },
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: tenantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: tenantKeys.all });
    },
  });
}

export function useSetTokens() {
  return useMutation({
    mutationFn: async ({
      id,
      ...tokens
    }: {
      id: number;
      wa_access_token?: string;
      ig_access_token?: string;
    }) => {
      const res = await apiFetch(`/api/tenants/${id}/set-tokens/`, {
        method: 'POST',
        body: JSON.stringify(tokens),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? 'Failed to save tokens');
      }
      return res.json().catch(() => ({}));
    },
  });
}
