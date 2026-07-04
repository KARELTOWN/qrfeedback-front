import { api } from '../api';

export type AdminStats = {
  totalReviews: number;
  totalQrCodes: number;
  totalUsers: number;
  totalRevenueFcfa: number;
};

export type AdminUser = {
  _id: string;
  email: string;
  roleId: string;
  isActive: boolean;
  emailVerified: boolean;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  company?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  revenueFcfa?: number;
  remainingCredits?: number;
  reviewsCount?: number;
};

export type AdminUsersResponse = {
  users: AdminUser[];
  pagination: PaginationMeta;
};

export type AdminTransaction = {
  _id: string;
  company?: { _id?: string; name?: string; email?: string };
  planCode: string;
  planLabel: string;
  messages: number;
  amountFcfa: number;
  status: string;
  paidAt?: string;
  createdAt?: string;
  invoiceNumber?: string;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type AdminAccountStatus = 'active' | 'inactive' | 'disabled' | 'none';

export type QrRequestsWithoutAccount = {
  total: number;
  companies: Array<{
    name: string;
    email: string;
    qrRequestsCount: number;
    userId?: string;
    isActive: boolean;
    lastLoginAt: string | null;
    status: AdminAccountStatus;
    createdAt: string;
  }>;
  pagination: PaginationMeta;
};

export type AdminUserDetails = {
  user: AdminUser;
  company: {
    _id: string;
    name: string;
    email: string;
  };
  qrCodesCount: number;
  reviewsCount: number;
  scanCount: number;
  remainingCredits: number;
  revenueFcfa: number;
  payments: AdminTransaction[];
};

export type InactiveUserItem = {
  user: AdminUser;
  company?: { _id?: string; name?: string };
  remainingCredits: number;
  revenueFcfa: number;
  lastPaidAt?: string;
  lastUsedAt?: string;
  reason: string;
};

export type InactiveUsersResponse = {
  users: InactiveUserItem[];
  pagination: PaginationMeta;
};

export type NotificationVariable = { key: string; label: string; description?: string };
export type NotificationTemplate = {
  _id?: string;
  name: string;
  label: string;
  emailTemplate: string;
  smsTemplate: string;
  emailTitle: string;
  smsTitle: string;
  emailVariables: NotificationVariable[];
  smsVariables: NotificationVariable[];
  isActive: boolean;
};

export type NotificationPreview = { email: { subject: string; html: string }; sms: { title: string; body: string } };

export function useAdmin() {
  function getStats() {
    return api<AdminStats>('/api/admin/stats');
  }

  function getUsers(params: { page?: number; limit?: number; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    return api<AdminUsersResponse>(`/api/admin/users${query.toString() ? `?${query.toString()}` : ''}`);
  }

  function getUserDetails(userId: string) {
    return api<AdminUserDetails>(`/api/admin/users/${userId}`);
  }

  function generatePassword(userId: string) {
    return api<{ ok: boolean }>(`/api/admin/users/${userId}/generate-password`, {
      method: 'POST'
    });
  }

  function setUserActive(userId: string, isActive: boolean) {
    return api<{ id: string; isActive: boolean }>(`/api/admin/users/${userId}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    });
  }

  function getQrRequestsWithoutAccount(params: { page?: number; limit?: number; accountFilter?: 'all' | 'with' | 'without'; search?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.accountFilter) query.set('accountFilter', params.accountFilter);
    if (params.search) query.set('search', params.search);
    return api<QrRequestsWithoutAccount>(`/api/admin/qr-requests/no-account${query.toString() ? `?${query.toString()}` : ''}`);
  }

  function getInactiveUsers(params: { page?: number; limit?: number } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return api<InactiveUsersResponse>(`/api/admin/inactive-users${query.toString() ? `?${query.toString()}` : ''}`);
  }

  function getNotificationTemplates() { return api<{ templates: NotificationTemplate[] }>('/api/admin/notification-templates'); }
  function createNotificationTemplate(template: NotificationTemplate) { return api<{ template: NotificationTemplate }>('/api/admin/notification-templates', { method: 'POST', body: JSON.stringify(template) }); }
  function updateNotificationTemplate(name: string, template: NotificationTemplate) {
    const { name: _name, ...payload } = template;
    return api<{ template: NotificationTemplate }>(`/api/admin/notification-templates/${encodeURIComponent(name)}`, { method: 'PATCH', body: JSON.stringify(payload) });
  }
  function previewNotificationTemplate(name: string, variables: Record<string, string>) { return api<NotificationPreview>(`/api/admin/notification-templates/${encodeURIComponent(name)}/preview`, { method: 'POST', body: JSON.stringify({ variables }) }); }

  return {
    getStats,
    getUsers,
    getUserDetails,
    generatePassword,
    setUserActive,
    getQrRequestsWithoutAccount,
    getInactiveUsers,
    getNotificationTemplates,
    createNotificationTemplate,
    updateNotificationTemplate,
    previewNotificationTemplate
  };
}
