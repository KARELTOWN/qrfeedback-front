import { api } from '../api';

export type ReviewInput = {
  serviceFeedback?: string;
  customAnswers?: Array<{ questionId: string; value: string | number }>;
  rating: number;
  turnstileToken?: string;
};

export type ReviewCreatedResponse = {
  id: string;
  notificationStatus: string;
  redirectUrl: string | null;
};

export function useReviews() {
  function createReview(slug: string | string[], payload: ReviewInput) {
    return api<ReviewCreatedResponse>(`/api/reviews/${slug}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  return { createReview };
}
