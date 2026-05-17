import { api } from '../api';

export type Plan = {
  code: string;
  label: string;
  messages: number;
  priceFcfa: number;
};

export type Payment = {
  id: string;
  status: string;
  amountFcfa: number;
  moneroWalletAddress: string;
  network: string;
  provider?: string;
  providerPaymentId?: string;
  checkoutUrl?: string;
  currency?: string;
};

export function usePayments() {
  function getPlans() {
    return api<Plan[]>('/api/plans');
  }

  function createPayment(payload: { companySlug?: string | string[]; planCode: string; email?: string }, authenticated: boolean) {
    const path = authenticated ? '/api/payments/authenticated' : '/api/payments';
    const body = authenticated ? { planCode: payload.planCode } : payload;
    return api<Payment>(path, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  function verifyPayment(paymentId: string) {
    return api<{ ok: boolean; payment: Payment }>(`/api/payments/${paymentId}/verify`, {
      method: 'POST'
    });
  }

  return { getPlans, createPayment, verifyPayment };
}
