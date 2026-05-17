import { api } from '../api';

export type ReviewInput = {
  customerName?: string;
  customerPhone?: string;
  serviceFeedback?: string;
  improvementSuggestion?: string;
  badExperience?: string;
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
