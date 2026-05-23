<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Send } from 'lucide-vue-next';
import { useInbox, type ContactMessage, type InboxConversation } from '../../composables/useInbox';

const { getConversations, getMessages, sendMessage } = useInbox();
const conversations = ref<InboxConversation[]>([]);
const selected = ref<InboxConversation | null>(null);
const messages = ref<ContactMessage[]>([]);
const reply = ref('');
const error = ref('');

const contactLabel = computed(() => {
  const contact = selected.value?.contact;
  if (!contact) return 'Conversation';
  return [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.whatsappNormalized || contact.whatsapp || contact.phone || contact.email || 'Contact';
});

function label(conversation: InboxConversation) {
  const contact = conversation.contact;
  return [contact?.firstName, contact?.lastName].filter(Boolean).join(' ') || contact?.whatsappNormalized || contact?.whatsapp || 'Contact WhatsApp';
}

async function load() {
  conversations.value = (await getConversations()).conversations;
  if (!selected.value && conversations.value[0]) await selectConversation(conversations.value[0]);
}

async function selectConversation(conversation: InboxConversation) {
  selected.value = conversation;
  const result = await getMessages(conversation._id);
  messages.value = result.messages;
}

async function submitReply() {
  if (!selected.value || !reply.value.trim()) return;
  error.value = '';
  try {
    await sendMessage(selected.value._id, reply.value);
    reply.value = '';
    await selectConversation(selected.value);
    await load();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur inconnue';
  }
}

onMounted(load);
</script>

<template>
  <section class="grid min-h-[620px] gap-4 xl:grid-cols-[360px_1fr]">
    <aside class="rounded-2xl border border-slate-200 bg-white">
      <div class="border-b border-slate-200 p-4">
        <h2 class="text-xl font-black text-ink">Inbox WhatsApp</h2>
      </div>
      <button
        v-for="conversation in conversations"
        :key="conversation._id"
        class="grid w-full gap-1 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50"
        :class="selected?._id === conversation._id ? 'bg-brand-50' : ''"
        @click="selectConversation(conversation)"
      >
        <span class="flex items-center justify-between gap-2">
          <strong class="truncate text-ink">{{ label(conversation) }}</strong>
          <span v-if="conversation.unreadCount" class="rounded-full bg-brand-700 px-2 py-0.5 text-xs font-black text-white">{{ conversation.unreadCount }}</span>
        </span>
        <span class="truncate text-sm font-semibold text-slate-500">{{ conversation.lastMessagePreview || '-' }}</span>
      </button>
      <p v-if="!conversations.length" class="p-5 text-sm font-bold text-slate-500">Aucune conversation pour le moment.</p>
    </aside>

    <div class="grid rounded-2xl border border-slate-200 bg-white">
      <header class="border-b border-slate-200 p-4">
        <h2 class="text-xl font-black text-ink">{{ contactLabel }}</h2>
        <p class="text-sm font-semibold text-slate-500">{{ selected?.status || 'open' }}</p>
      </header>
      <div class="max-h-[520px] min-h-[420px] space-y-3 overflow-y-auto bg-slate-50 p-4">
        <div v-for="message in messages" :key="message._id" class="flex" :class="message.direction === 'outbound' ? 'justify-end' : 'justify-start'">
          <div class="max-w-[78%] rounded-2xl px-4 py-3 shadow-sm" :class="message.direction === 'outbound' ? 'bg-brand-700 text-white' : 'bg-white text-ink'">
            <p class="whitespace-pre-line font-semibold">{{ message.body || '-' }}</p>
            <p class="mt-2 text-xs font-bold opacity-70">{{ message.status }} · {{ new Date(message.createdAt).toLocaleString('fr-FR') }}</p>
          </div>
        </div>
      </div>
      <form class="border-t border-slate-200 p-4" @submit.prevent="submitReply">
        <p v-if="error" class="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{{ error }}</p>
        <div class="grid grid-cols-[1fr_auto] gap-3">
          <textarea v-model="reply" rows="2" placeholder="Répondre sur WhatsApp..." class="resize-none rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-brand-700"></textarea>
          <button class="grid h-full min-h-14 w-14 place-items-center rounded-xl bg-brand-700 text-white" :disabled="!selected"><Send :size="20" /></button>
        </div>
      </form>
    </div>
  </section>
</template>
