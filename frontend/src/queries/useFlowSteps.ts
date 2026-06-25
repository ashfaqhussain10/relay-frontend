import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { FlowStep, FlowOption, PaginatedResponse, ValidationResult } from '../types';

export const flowStepKeys = {
  byTenant: (tenantId: number) => ['flow-steps', tenantId] as const,
};

export const validateKeys = {
  byTenant: (tenantId: number) => ['validate', tenantId] as const,
};

function invalidateFlow(qc: ReturnType<typeof useQueryClient>, tenantId: number) {
  qc.invalidateQueries({ queryKey: flowStepKeys.byTenant(tenantId) });
  qc.invalidateQueries({ queryKey: validateKeys.byTenant(tenantId) });
}

export function useFlowSteps(tenantId: number) {
  return useQuery({
    queryKey: flowStepKeys.byTenant(tenantId),
    queryFn: async (): Promise<FlowStep[]> => {
      const res = await apiFetch(`/api/flow-steps/?tenant=${tenantId}&page_size=200`);
      if (!res.ok) throw new Error('Failed to load flow steps');
      const data: PaginatedResponse<FlowStep> = await res.json();
      return data.results;
    },
    enabled: tenantId > 0,
  });
}

export function useValidateTenant(tenantId: number) {
  return useQuery({
    queryKey: validateKeys.byTenant(tenantId),
    queryFn: async (): Promise<ValidationResult> => {
      const res = await apiFetch(`/api/tenants/${tenantId}/validate/`);
      if (!res.ok) throw new Error('Failed to validate flow');
      return res.json();
    },
    enabled: tenantId > 0,
  });
}

export function useCreateFlowStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      tenant: number;
      label: string;
      message_text: string;
      is_start: boolean;
      is_terminal: boolean;
    }): Promise<FlowStep> => {
      const res = await apiFetch('/api/flow-steps/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create flow step');
      return res.json();
    },
    onSuccess: (step) => invalidateFlow(qc, step.tenant),
  });
}

export function usePatchFlowStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: { id: number } & Partial<Omit<FlowStep, 'id' | 'created_at' | 'options'>>): Promise<FlowStep> => {
      const res = await apiFetch(`/api/flow-steps/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update step');
      return res.json();
    },
    onSuccess: (step) => invalidateFlow(qc, step.tenant),
  });
}

export function useDeleteFlowStep() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tenantId }: { id: number; tenantId: number }) => {
      const res = await apiFetch(`/api/flow-steps/${id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete step');
      return tenantId;
    },
    onSuccess: (tenantId) => invalidateFlow(qc, tenantId),
  });
}

export function useCreateFlowOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      tenantId: _tenantId,
      ...data
    }: {
      tenantId?: number;
      step: number;
      button_label: string;
      next_step: number | null;
    }): Promise<FlowOption> => {
      const res = await apiFetch('/api/flow-options/', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create option');
      return res.json();
    },
    onSuccess: (_opt, { tenantId }) => {
      if (tenantId) invalidateFlow(qc, tenantId);
    },
  });
}

export function usePatchFlowOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      tenantId: _tenantId,
      ...data
    }: { id: number; tenantId: number } & Partial<Omit<FlowOption, 'id'>>): Promise<FlowOption> => {
      const res = await apiFetch(`/api/flow-options/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update option');
      return res.json();
    },
    onSuccess: (_opt, { tenantId }) => invalidateFlow(qc, tenantId),
  });
}

export function useDeleteFlowOption() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, tenantId }: { id: number; tenantId: number }) => {
      const res = await apiFetch(`/api/flow-options/${id}/`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete option');
      return tenantId;
    },
    onSuccess: (tenantId) => invalidateFlow(qc, tenantId),
  });
}
