import { api } from '../api';

export type ReviewInput = {
  serviceFeedback?: string;
  customAnswers?: Array<{ questionId: string; value: string | number }>;
  rating: number;
};

export function useReviews() {
  function createReview(slug: string | string[], payload: ReviewInput) {
    return api(`/api/reviews/${slug}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  return { createReview };
}
