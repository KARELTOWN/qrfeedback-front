import { api } from '../api';

export type RegisterCompanyInput = {
  name: string;
  email: string;
  whatsappNumber: string;
  turnstileToken?: string;
};

export type RegisterCompanyResult = {
  id: string;
  name: string;
  slug: string;
  feedbackUrl: string;
  qrCodeDataUrl: string;
  freeMessagesLimit: number;
};

export type PublicProof = {
  companiesCount: number;
  reviewsCount: number;
  trusts: Array<{
    id: string;
    companyName: string;
    createdAt: string;
  }>;
};

export function useCompany() {
  function registerCompany(payload: RegisterCompanyInput) {
    return api<RegisterCompanyResult>('/api/companies/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  function getPublicCompany(slug: string | string[]) {
    return api<{ name: string; slug: string; feedbackUrl: string }>(`/api/companies/${slug}`);
  }

  function getPublicProof() {
    return api<PublicProof>('/api/companies/public/proof');
  }

  return { registerCompany, getPublicCompany, getPublicProof };
}
