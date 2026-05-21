import { api, API_URL, getToken } from '../api';

export type DashboardStats = {
  company: {
    name: string;
  };
  count: number;
  averageRating: number;
  remainingMessages: number;
};

export type Review = {
  _id: string;
  createdAt: string;
  rating: number;
  serviceFeedback?: string;
  notificationStatus: string;
  notificationError?: string;
  notificationWhatsappNumber?: string;
  customAnswers?: Array<{
    questionId: string;
    label: string;
    type: string;
    value: string | number;
  }>;
  qrCode?: {
    _id: string;
    whatsappNumber: string;
    label?: string;
    slug: string;
  };
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
};

export type CompanyQrCode = {
  _id: string;
  whatsappNumber: string;
  slug: string;
  feedbackUrl: string;
  qrCodeDataUrl: string;
  label?: string;
  reviewCount: number;
  createdAt: string;
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

export type FeedbackFieldConfig = {
  key: 'serviceFeedback';
  label: string;
  placeholder?: string;
  enabled: boolean;
  required: boolean;
};

export type CustomQuestionConfig = {
  id: string;
  type: 'text' | 'textarea' | 'rating' | 'select' | 'email' | 'phone';
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

  function getReviews(page = 1, limit = 10) {
    return api<PaginatedReviews>(`/api/dashboard/reviews?page=${page}&limit=${limit}`);
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

  function createQrCode(payload: { whatsappNumber: string; label?: string }) {
    return api<CompanyQrCode>('/api/qrcodes', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async function exportReviewsCsv() {
    const response = await fetch(`${API_URL}/api/dashboard/export.xlsx`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.blob();
  }

  return { getStats, getReviews, getQrCodes, getMonthlyEvolution, getRatingDistribution, getFeedbackFormConfig, updateFeedbackFormConfig, createQrCode, exportReviewsCsv };
}
