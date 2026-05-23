import { api } from '../api';

export type WhatsappConfig = {
  id: string;
  wabaId: string;
  phoneNumberId: string;
  businessAccountId?: string;
  displayPhoneNumber?: string;
  status: 'pending' | 'active' | 'disabled' | 'error';
  accessToken?: string;
  lastVerifiedAt?: string;
  lastError?: string;
};

export type WhatsappTemplate = {
  _id: string;
  name: string;
  languageCode: string;
  category: string;
  status: string;
  components?: unknown;
  estimatedCreditCost: number;
  updatedAt: string;
};

export function useWhatsApp() {
  function getConfig() {
    return api<{ config: WhatsappConfig | null }>('/api/whatsapp/config');
  }

  function saveConfig(payload: {
    wabaId: string;
    phoneNumberId: string;
    accessToken: string;
    businessAccountId?: string;
    displayPhoneNumber?: string;
    webhookVerifyToken?: string;
    webhookSecret?: string;
    status?: string;
  }) {
    return api<{ config: WhatsappConfig }>('/api/whatsapp/config', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  }

  function getTemplates() {
    return api<{ templates: WhatsappTemplate[] }>('/api/whatsapp/templates');
  }

  function saveTemplate(payload: {
    name: string;
    languageCode?: string;
    category?: string;
    status?: string;
    components?: unknown;
    externalId?: string;
  }) {
    return api<{ template: WhatsappTemplate }>('/api/whatsapp/templates', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  function deleteTemplate(id: string) {
    return api<{ ok: boolean }>(`/api/whatsapp/templates/${id}`, { method: 'DELETE' });
  }

  function estimateCost(payload: { messageType?: 'text' | 'template'; templateId?: string; recipient?: string }) {
    return api<{ estimate: { estimatedCreditCost: number; reason: string }; remainingCredits: number }>('/api/whatsapp/estimate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  function sendTestMessage(payload: { to: string; templateName?: string; languageCode?: string }) {
    return api<{ ok: boolean; result: { id: string; status: string } }>('/api/whatsapp/test-message', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  return { getConfig, saveConfig, getTemplates, saveTemplate, deleteTemplate, estimateCost, sendTestMessage };
}
