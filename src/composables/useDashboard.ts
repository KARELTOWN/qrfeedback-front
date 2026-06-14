import { api, API_URL, getToken } from '../api';

export type DashboardStats = {
  company: {
    name: string;
  };
  count: number;
  averageRating: number;
  remainingMessages: number | null;
  remainingEmailNotifications: number | null;
  unlimitedAccess: boolean;
};

export type Review = {
  _id: string;
  createdAt: string;
  rating: number;
  serviceFeedback?: string;
  notificationStatus: string;
  notificationError?: string;
  notificationWhatsappNumber?: string;
  emailNotificationStatus?: string;
  emailNotificationError?: string;
  notificationEmail?: string;
  customAnswers?: Array<{
    questionId: string;
    label: string;
    type: string;
    value: string | number;
  }>;
  qrCode?: {
    _id: string;
    whatsappNumber?: string;
    label?: string;
    slug: string;
  };
};

export type NotificationPreferences = {
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  telegramEnabled: boolean;
};

export type TelegramProfile = {
  chatId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PaginatedReviews = {
  reviews: Review[];
  pagination: PaginationMeta;
  engine?: 'typesense';
};

export type ReviewFilters = {
  contactType?: 'email' | 'phone' | 'fullName';
  contactValue?: string;
  query?: string;
  rating?: number | '';
  sentiment?: 'positive' | 'neutral' | 'negative' | '';
  startDate?: string;
  endDate?: string;
};

export type CompanyQrCode = {
  _id: string;
  whatsappNumber?: string;
  slug: string;
  feedbackUrl: string;
  qrCodeDataUrl: string;
  label?: string;
  reviewCount: number;
  createdAt: string;
  notificationPreferences?: NotificationPreferences;
};

export type PaginatedQrCodes = {
  qrCodes: CompanyQrCode[];
  pagination: PaginationMeta;
};

export type MonthlyEvolution = {
  year: number;
  months: Array<{ month: number; count: number }>;
};

export type RatingDistribution = Array<{ rating: number; count: number }>;

export type AiProblemCluster = {
  key: string;
  label: string;
  impact: 'high' | 'medium' | 'low';
  count: number;
  negativeCount: number;
  averageRating: number;
  examples: Array<{ id: string; rating: number; createdAt: string; text: string }>;
};

export type AiOverview = {
  generatedAt: string;
  totalReviews: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    averageScore: number;
    positiveRate: number;
    negativeRate: number;
  };
  trends: {
    text: string;
    recentCount: number;
    previousCount: number;
    recentAverage: number;
    previousAverage: number;
    averageDelta: number;
  };
  problems: AiProblemCluster[];
};

export type AiSearchResult = PaginatedReviews & {
  engine: 'typesense' | 'mongo-fallback' | 'none';
};

export type FeedbackFieldConfig = {
  key: 'serviceFeedback';
  label: string;
  placeholder?: string;
  enabled: boolean;
  required: boolean;
};

export type CustomQuestionConfig = {
  id: string;
  type: 'text' | 'textarea' | 'rating' | 'select' | 'email' | 'phone' | 'fullName';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
};

export type FeedbackFormConfig = {
  title: string;
  fields: FeedbackFieldConfig[];
  customQuestions: CustomQuestionConfig[];
};

export function useDashboard() {
  function getStats() {
    return api<DashboardStats>('/api/dashboard/stats');
  }

  function getReviews(page = 1, limit = 10, filters: ReviewFilters = {}) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters.contactType && filters.contactValue) {
      params.set('contactType', filters.contactType);
      params.set('contactValue', filters.contactValue);
    }
    if (filters.query) params.set('q', filters.query);
    if (filters.rating) params.set('rating', String(filters.rating));
    if (filters.sentiment) params.set('sentiment', filters.sentiment);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    return api<PaginatedReviews>(`/api/dashboard/reviews?${params.toString()}`);
  }

  function getQrCodes(page = 1, limit = 10) {
    return api<PaginatedQrCodes>(`/api/qrcodes?page=${page}&limit=${limit}`);
  }

  function getMonthlyEvolution(years: number[]) {
    const query = years.length ? `?years=${years.join(',')}` : '';
    return api<MonthlyEvolution[]>(`/api/dashboard/monthly-evolution${query}`);
  }

  function getRatingDistribution(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api<RatingDistribution>(`/api/dashboard/rating-distribution${query}`);
  }

  function getFeedbackFormConfig() {
    return api<FeedbackFormConfig>('/api/dashboard/feedback-form-config');
  }

  function updateFeedbackFormConfig(payload: FeedbackFormConfig) {
    return api<FeedbackFormConfig>('/api/dashboard/feedback-form-config', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  function getNotificationPreferences() {
    return api<NotificationPreferences>('/api/dashboard/notification-preferences');
  }

  function updateNotificationPreferences(payload: NotificationPreferences) {
    return api<NotificationPreferences>('/api/dashboard/notification-preferences', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  function getTelegramLink() {
    return api<{ ok: boolean; url: string; expiresInSeconds: number }>('/api/notifications/telegram-link');
  }

  function getTelegramProfile() {
    return api<{ ok: boolean; telegramProfile: TelegramProfile | null }>('/api/notifications/telegram-profile');
  }

  function getAiOverview(startDate?: string, endDate?: string, qrCodeId?: string) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (qrCodeId) params.set('qrCodeId', qrCodeId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api<AiOverview>(`/api/dashboard/ai/overview${query}`);
  }

  function searchAiReviews(query: string, page = 1, limit = 10, filters: { startDate?: string; endDate?: string; qrCodeId?: string } = {}) {
    const params = new URLSearchParams({ q: query, page: String(page), limit: String(limit) });
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.qrCodeId) params.set('qrCodeId', filters.qrCodeId);
    return api<AiSearchResult>(`/api/dashboard/ai/search?${params.toString()}`);
  }

  function reindexAiReviews() {
    return api<{ indexed: number; enabled: boolean }>('/api/dashboard/ai/reindex', { method: 'POST' });
  }

  function createQrCode(payload: { whatsappNumber?: string; label?: string }) {
    return api<CompanyQrCode>('/api/qrcodes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  function updateQrCodeNotifications(qrCodeId: string, payload: NotificationPreferences) {
    return api<CompanyQrCode>(`/api/qrcodes/${qrCodeId}/notifications`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  async function exportReviewsCsv() {
    const response = await fetch(`${API_URL}/api/dashboard/export.xlsx`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.blob();
  }

  return { getStats, getReviews, getQrCodes, getMonthlyEvolution, getRatingDistribution, getFeedbackFormConfig, updateFeedbackFormConfig, getNotificationPreferences, updateNotificationPreferences, getTelegramLink, getTelegramProfile, getAiOverview, searchAiReviews, reindexAiReviews, createQrCode, updateQrCodeNotifications, exportReviewsCsv };
}
