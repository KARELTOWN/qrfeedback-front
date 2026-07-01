import { api } from '../api';

export type TestimonialReview = {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  createdAt: string;
};

export type TestimonialsData = {
  companyName: string;
  reviews: TestimonialReview[];
};

export function useTestimonials() {
  function getPublicTestimonials(slug: string | string[], limit?: number) {
    const query = limit ? `?limit=${limit}` : '';
    return api<TestimonialsData>(`/api/public/testimonials/${slug}${query}`);
  }

  return { getPublicTestimonials };
}
