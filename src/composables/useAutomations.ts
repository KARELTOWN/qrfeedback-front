import { api } from '../api';

export type Automation = {
  _id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  entryPolicy: string;
  version: number;
  updatedAt: string;
};

export type AutomationTrigger = {
  _id?: string;
  type: string;
  config?: Record<string, unknown>;
  enabled?: boolean;
};

export type AutomationStep = {
  _id?: string;
  key: string;
  type: 'condition' | 'delay' | 'action';
  actionType?: string;
  name?: string;
  position?: number;
  config?: Record<string, unknown>;
  nextStepKey?: string;
  enabled?: boolean;
};

export type AutomationDetail = {
  automation: Automation;
  triggers: AutomationTrigger[];
  steps: AutomationStep[];
};

export type AutomationTestResult = {
  execution: {
    _id: string;
    status: string;
    lastError?: { message?: string };
  };
  logs: Array<{
    _id: string;
    level: string;
    event: string;
    message?: string;
    stepKey?: string;
    data?: Record<string, unknown>;
    error?: { message?: string };
  }>;
};

export function useAutomations() {
  function listAutomations() {
    return api<{ automations: Automation[] }>('/api/automations');
  }

  function getAutomation(id: string) {
    return api<AutomationDetail>(`/api/automations/${id}`);
  }

  function createAutomation(payload: Partial<Automation> & { triggers?: AutomationTrigger[]; steps?: AutomationStep[] }) {
    return api<AutomationDetail>('/api/automations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  function updateAutomation(id: string, payload: Partial<Automation> & { triggers?: AutomationTrigger[]; steps?: AutomationStep[] }) {
    return api<AutomationDetail>(`/api/automations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  function publishAutomation(id: string) {
    return api<AutomationDetail>(`/api/automations/${id}/publish`, { method: 'POST' });
  }

  function pauseAutomation(id: string) {
    return api<AutomationDetail>(`/api/automations/${id}/pause`, { method: 'POST' });
  }

  function deleteAutomation(id: string) {
    return api<{ ok: boolean }>(`/api/automations/${id}`, { method: 'DELETE' });
  }

  function testAutomation(id: string, context: Record<string, unknown>) {
    return api<AutomationTestResult>(`/api/automations/${id}/test`, {
      method: 'POST',
      body: JSON.stringify({ context })
    });
  }

  return { listAutomations, getAutomation, createAutomation, updateAutomation, publishAutomation, pauseAutomation, deleteAutomation, testAutomation };
}
