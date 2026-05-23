import { api } from '../api';
import type { PaginationMeta } from './useDashboard';

export type SegmentOperator =
  | 'exists'
  | 'not_exists'
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'in'
  | 'not_in'
  | '<'
  | '<='
  | '>'
  | '>='
  | 'within_last_days'
  | 'older_than_days';

export type SegmentCondition = {
  field: string;
  operator: SegmentOperator;
  value?: unknown;
  windowDays?: number;
};

export type Segment = {
  _id: string;
  name: string;
  description?: string;
  type: 'dynamic' | 'static';
  matchType: 'all' | 'any';
  conditions: SegmentCondition[];
  contactCount: number;
  lastCalculatedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type SegmentTemplate = {
  key: string;
  name: string;
  description: string;
  matchType: 'all' | 'any';
  conditions: SegmentCondition[];
};

export type SegmentPayload = {
  name: string;
  description?: string;
  type?: 'dynamic' | 'static';
  matchType?: 'all' | 'any';
  conditions?: SegmentCondition[];
  contactIds?: string[];
};

export type SegmentContactFilterPayload = {
  search?: string;
  matchType?: 'all' | 'any';
  conditions?: SegmentCondition[];
};

export function useSegments() {
  function listSegments(page = 1, limit = 20) {
    return api<{ segments: Segment[]; pagination: PaginationMeta }>(`/api/segments?page=${page}&limit=${limit}`);
  }

  function listSegmentTemplates() {
    return api<{ templates: SegmentTemplate[] }>('/api/segments/templates');
  }

  function createSegment(payload: SegmentPayload) {
    return api<{ segment: Segment }>('/api/segments', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  function filterContacts(payload: SegmentContactFilterPayload = {}, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (payload.search) params.set('search', payload.search);
    return api<{ contacts: unknown[]; pagination: PaginationMeta }>(`/api/segments/contacts/filter?${params.toString()}`, {
      method: 'POST',
      body: JSON.stringify({
        conditions: payload.conditions || [],
        matchType: payload.matchType || 'all'
      })
    });
  }

  function previewSegment(payload: SegmentContactFilterPayload = {}) {
    return api<{ count: number; contactIds: string[] }>('/api/segments/preview', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  function updateSegment(id: string, payload: Partial<SegmentPayload>) {
    return api<{ segment: Segment }>(`/api/segments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  function deleteSegment(id: string) {
    return api<{ segment: Segment }>(`/api/segments/${id}`, {
      method: 'DELETE'
    });
  }

  function recalculateSegment(id: string) {
    return api<{ segment: Segment }>(`/api/segments/${id}/recalculate`, {
      method: 'POST'
    });
  }

  function listSegmentMembers(id: string, page = 1, limit = 20) {
    return api<{ members: unknown[]; pagination: PaginationMeta }>(`/api/segments/${id}/members?page=${page}&limit=${limit}`);
  }

  return {
    listSegments,
    listSegmentTemplates,
    filterContacts,
    previewSegment,
    createSegment,
    updateSegment,
    deleteSegment,
    recalculateSegment,
    listSegmentMembers
  };
}
