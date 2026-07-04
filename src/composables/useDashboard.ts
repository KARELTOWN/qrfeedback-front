import { api, API_URL, getToken } from '../api';

export type DashboardStats = {
  company: {
    name: string;
    slug: string;
  };
  count: number;
  scanCount: number;
  conversionRate: number;
  averageRating: number;
  ratingGoal: number;
  remainingMessages: number | null;
  remainingEmailNotifications: number | null;
  unlimitedAccess: boolean;
  comparison?: {
    previousCount: number;
    previousAverageRating: number;
    countDelta: number;
    averageRatingDelta: number;
  };
  byQrCode?: Array<{
    qrCodeId: string;
    label: string;
    slug?: string;
    isActive: boolean;
    count: number;
    scanCount: number;
    conversionRate: number;
    averageRating: number;
  }>;
};

export type Review = {
  _id: string;
  createdAt: string;
  rating: number;
  serviceFeedback?: string;
  notificationStatus: string;
  notificationError?: string;
  emailNotificationStatus?: string;
  emailNotificationError?: string;
  notificationEmail?: string;
  moderationStatus?: 'published' | 'archived';
  tags?: string[];
  internalNote?: string;
  responseText?: string;
  respondedAt?: string;
  customAnswers?: Array<{
    questionId: string;
    label: string;
    type: string;
    value: string | number;
  }>;
  qrCode?: {
    _id: string;
    label?: string;
    slug: string;
    isActive?: boolean;
  };
};

export type NotificationPreferences = {
  emailEnabled: boolean;
  telegramEnabled: boolean;
  smsEnabled?: boolean;
  managerPhone?: string | null;
  badReviewThreshold?: number;
  autoReplyEnabled?: boolean;
  autoReplyMode?: 'ai' | 'manual';
  autoReplySatisfiedThreshold?: number;
  autoReplySatisfiedMessage?: string;
  autoReplyUnsatisfiedMessage?: string;
};

export type ReviewRedirectConfig = {
  enabled: boolean;
  goodRatingThreshold: number;
  redirectUrl: string | null;
};

export type AiReplySuggestions = {
  suggestions: string[];
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
  notificationStatus?: string;
  qrCodeId?: string;
  channel?: 'email' | 'telegram' | '';
  moderationStatus?: string;
  includeArchived?: boolean;
  startDate?: string;
  endDate?: string;
};

export type CompanyQrCode = {
  _id: string;
  slug: string;
  feedbackUrl: string;
  qrCodeDataUrl: string;
  label?: string;
  isActive?: boolean;
  disabledAt?: string;
  reviewCount: number;
  scanCount: number;
  conversionRate: number;
  averageRating?: number;
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

export type AiSentimentTrendPoint = { startDate: string; endDate: string; count: number; positiveRate: number; neutralRate: number; negativeRate: number };

export type AiAnalysis = AiOverview & {
  period?: { startDate: string | null; endDate: string | null; qrCodeId: string | null };
  comparisonPeriod?: { startDate: string | null; endDate: string | null; isCustom: boolean };
  reviews: { count: number; averageRating: number; urgent: Array<{ id: string; rating: number; createdAt: string; text: string }> };
  comparison: {
    previousReviewCount: number;
    reviewCountDelta: number;
    previousAverageRating: number;
    averageRatingDelta: number;
    previousScanCount: number;
    scanCountDelta: number;
    previousConversionRate: number;
  };
  scans: { count: number; conversionRate: number };
  topics: AiProblemCluster[];
  summary: string;
  sentimentTrend: AiSentimentTrendPoint[];
};

export type AiAnalysisQuery = { startDate?: string; endDate?: string; comparisonStartDate?: string; comparisonEndDate?: string; qrCodeId?: string; weeks?: 4 | 6 | 8 };

export type RecommendationResult = {
  recommendations: Array<{ priority: 'high' | 'medium' | 'low'; title: string; action: string; reason: string }>;
  quota?: { remaining: number; resetAt: string };
};

export type QrTrend = {
  qrCodeId: string;
  label: string;
  slug: string;
  isActive: boolean;
  currentRating: number;
  positiveRate: number;
  negativeRate: number;
  trend: { direction: 'up' | 'down' | 'stable'; delta: number; method: string };
  sparkline: Array<{ start: string; end: string; count: number; averageRating: number | null }>;
  stats: { min: number; max: number; average: number; reviews: number; scans: number };
};

export type AiSearchResult = PaginatedReviews & {
  engine: 'typesense' | 'mongo-fallback' | 'none' | 'topic';
  topicLabel?: string;
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
  welcomeTitle: string;
  welcomeMessage: string;
  fields: FeedbackFieldConfig[];
  customQuestions: CustomQuestionConfig[];
};

export function useDashboard() {
  function getStats(filters: { startDate?: string; endDate?: string; qrCodeId?: string } = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.qrCodeId) params.set('qrCodeId', filters.qrCodeId);
    const query = params.toString() ? `?${params.toString()}` : '';
    return api<DashboardStats>(`/api/dashboard/stats${query}`);
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
    if (filters.notificationStatus) params.set('notificationStatus', filters.notificationStatus);
    if (filters.qrCodeId) params.set('qrCodeId', filters.qrCodeId);
    if (filters.channel) params.set('channel', filters.channel);
    if (filters.moderationStatus) params.set('moderationStatus', filters.moderationStatus);
    if (filters.includeArchived) params.set('includeArchived', 'true');
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

  function updateRatingGoal(ratingGoal: number) {
    return api<{ ratingGoal: number }>('/api/dashboard/rating-goal', {
      method: 'PATCH',
      body: JSON.stringify({ ratingGoal })
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

  function analyse(payload: AiAnalysisQuery) {
    return api<AiAnalysis>('/api/analyse', { method: 'POST', body: JSON.stringify(payload) });
  }

  async function getRecommendations(payload: AiAnalysisQuery): Promise<RecommendationResult> {
    const response = await api<Response>('/api/recommandations', { method: 'POST', body: JSON.stringify(payload), raw: true });
    const data = await response.json() as RecommendationResult;
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const resetAt = response.headers.get('X-Reset-At');
    return {
      ...data,
      quota: remaining !== null && resetAt ? { remaining: Number(remaining), resetAt } : data.quota
    };
  }

  function getQrTrends(weeks: 4 | 6 | 8) {
    return api<{ weeks: 4 | 6 | 8; items: QrTrend[] }>(`/api/dashboard/qr-trends?weeks=${weeks}`);
  }

  function searchAiReviews(query: string, page = 1, limit = 10, filters: { startDate?: string; endDate?: string; qrCodeId?: string } = {}) {
    const params = new URLSearchParams({ q: query, page: String(page), limit: String(limit) });
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.qrCodeId) params.set('qrCodeId', filters.qrCodeId);
    return api<AiSearchResult>(`/api/dashboard/ai/search?${params.toString()}`);
  }

  function getReviewsForTopic(topicKey: string, query: AiAnalysisQuery, page = 1, limit = 10) {
    return api<AiSearchResult>(`/api/analyse/topics/${topicKey}?page=${page}&limit=${limit}`, {
      method: 'POST',
      body: JSON.stringify(query)
    });
  }

  function reindexAiReviews() {
    return api<{ indexed: number; enabled: boolean }>('/api/dashboard/ai/reindex', { method: 'POST' });
  }

  async function exportAiAnalysisPdf(payload: AiAnalysisQuery & { recommendations?: RecommendationResult['recommendations'] }) {
    const response = await api<Response>('/api/analyse/export.pdf', { method: 'POST', body: JSON.stringify(payload), raw: true });
    return response.blob();
  }

  function createQrCode(payload: { label?: string }) {
    return api<CompanyQrCode>('/api/qrcodes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  function updateQrCode(qrCodeId: string, payload: { label?: string; isActive?: boolean }) {
    return api<CompanyQrCode>(`/api/qrcodes/${qrCodeId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  function disableQrCode(qrCodeId: string) {
    return api<CompanyQrCode>(`/api/qrcodes/${qrCodeId}`, { method: 'DELETE' });
  }

  function updateQrCodeNotifications(qrCodeId: string, payload: NotificationPreferences) {
    return api<CompanyQrCode>(`/api/qrcodes/${qrCodeId}/notifications`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  function getReviewRedirectConfig() {
    return api<ReviewRedirectConfig>('/api/dashboard/review-redirect-config');
  }

  function updateReviewRedirectConfig(payload: ReviewRedirectConfig) {
    return api<ReviewRedirectConfig>('/api/dashboard/review-redirect-config', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }

  function suggestReviewReply(reviewId: string) {
    return api<AiReplySuggestions>(`/api/dashboard/reviews/${reviewId}/ai-suggest-reply`, {
      method: 'POST'
    });
  }

  function updateReviewModeration(reviewId: string, payload: {
    moderationStatus?: 'published' | 'archived';
    tags?: string[];
    internalNote?: string;
    responseText?: string;
  }) {
    return api<Review>(`/api/dashboard/reviews/${reviewId}/moderation`, {
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

  async function downloadQrCodeAsset(qrCodeId: string, format: 'png' | 'pdf') {
    const response = await fetch(`${API_URL}/api/qrcodes/${qrCodeId}/download.${format}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    if (!response.ok) throw new Error('Telechargement impossible.');
    return response.blob();
  }

  return { getStats, getReviews, getQrCodes, getMonthlyEvolution, getRatingDistribution, getFeedbackFormConfig, updateFeedbackFormConfig, getNotificationPreferences, updateNotificationPreferences, getReviewRedirectConfig, updateReviewRedirectConfig, suggestReviewReply, updateRatingGoal, getTelegramLink, getTelegramProfile, getAiOverview, analyse, getRecommendations, getQrTrends, searchAiReviews, getReviewsForTopic, reindexAiReviews, exportAiAnalysisPdf, createQrCode, updateQrCode, disableQrCode, updateQrCodeNotifications, updateReviewModeration, exportReviewsCsv, downloadQrCodeAsset };
}
