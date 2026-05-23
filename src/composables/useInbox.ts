import { api } from '../api';

export type InboxContact = {
  _id: string;
  firstName?: string;
  lastName?: string;
  whatsapp?: string;
  whatsappNormalized?: string;
  phone?: string;
  email?: string;
};

export type InboxConversation = {
  _id: string;
  contact?: InboxContact;
  channel: string;
  status: string;
  lastMessageAt?: string;
  lastMessagePreview?: string;
  unreadCount: number;
};

export type ContactMessage = {
  _id: string;
  direction: 'inbound' | 'outbound';
  status: string;
  body?: string;
  from?: string;
  to?: string;
  createdAt: string;
};

export function useInbox() {
  function getConversations() {
    return api<{ conversations: InboxConversation[] }>('/api/inbox/conversations');
  }

  function getMessages(conversationId: string) {
    return api<{ conversation: InboxConversation; messages: ContactMessage[] }>(`/api/inbox/conversations/${conversationId}/messages`);
  }

  function sendMessage(conversationId: string, body: string) {
    return api(`/api/inbox/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ body })
    });
  }

  return { getConversations, getMessages, sendMessage };
}
