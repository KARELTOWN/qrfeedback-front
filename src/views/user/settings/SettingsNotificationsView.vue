<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { Mail, MessageSquareText, Send, Smartphone, ToggleLeft, ToggleRight } from 'lucide-vue-next';
import { useDashboard, type NotificationPreferences, type TelegramProfile } from '../../../composables/useDashboard';

const { getNotificationPreferences, updateNotificationPreferences, getTelegramLink, getTelegramProfile } = useDashboard();
const SMS_FEATURE_ENABLED = false;
const notificationPreferences = ref<NotificationPreferences>({ emailEnabled: true, telegramEnabled: true, smsEnabled: false, managerPhone: null, badReviewThreshold: 2, autoReplyEnabled: true, autoReplyMode: 'manual', autoReplySatisfiedThreshold: 4, autoReplySatisfiedMessage: '', autoReplyUnsatisfiedMessage: '' });
const telegramProfile = ref<TelegramProfile | null>(null);
const notificationMessage = ref('');
const notificationMessageType = ref<'success' | 'error' | 'info'>('info');
let telegramPollTimer: ReturnType<typeof setInterval> | null = null;

async function saveNotificationPreferences() {
  notificationMessage.value = '';
  try {
    notificationPreferences.value = await updateNotificationPreferences(notificationPreferences.value);
    notificationMessage.value = 'Préférences enregistrées.';
    notificationMessageType.value = 'success';
  } catch (err) {
    notificationMessage.value = err instanceof Error ? err.message : 'Erreur inconnue';
    notificationMessageType.value = 'error';
  }
}

function stopTelegramPolling() {
  if (telegramPollTimer) {
    clearInterval(telegramPollTimer);
    telegramPollTimer = null;
  }
}
function startTelegramPolling(popup: Window | null) {
  stopTelegramPolling();
  const deadline = Date.now() + 2 * 60 * 1000;
  telegramPollTimer = setInterval(async () => {
    if (Date.now() > deadline) {
      stopTelegramPolling();
      return;
    }
    const profile = await refreshTelegramProfile();
    if (profile) {
      notificationMessage.value = `Telegram connecté${profile.username ? ' à @' + profile.username : ''}.`;
      notificationMessageType.value = 'success';
      popup?.close();
      stopTelegramPolling();
    }
  }, 3000);
}
async function connectTelegram() {
  notificationMessage.value = '';
  try {
    const link = await getTelegramLink();
    const popup = window.open(link.url, '_blank', 'noreferrer');
    notificationMessage.value = 'Connexion Telegram ouverte. Validez dans Telegram, vous serez reconnecté automatiquement ici.';
    notificationMessageType.value = 'info';
    startTelegramPolling(popup);
  } catch (err) {
    notificationMessage.value = err instanceof Error ? err.message : 'Erreur inconnue';
    notificationMessageType.value = 'error';
  }
}
async function refreshTelegramProfile() {
  const result = await getTelegramProfile();
  telegramProfile.value = result.telegramProfile?.isActive ? result.telegramProfile : null;
  return telegramProfile.value;
}

onMounted(async () => {
  const preferences = await getNotificationPreferences();
  notificationPreferences.value = {
    emailEnabled: preferences.emailEnabled ?? true,
    telegramEnabled: preferences.telegramEnabled ?? true,
    smsEnabled: preferences.smsEnabled ?? false,
    managerPhone: preferences.managerPhone ?? null,
    badReviewThreshold: preferences.badReviewThreshold ?? 2,
    autoReplyEnabled: preferences.autoReplyEnabled ?? true,
    autoReplyMode: preferences.autoReplyMode ?? 'manual',
    autoReplySatisfiedThreshold: preferences.autoReplySatisfiedThreshold ?? 4,
    autoReplySatisfiedMessage: preferences.autoReplySatisfiedMessage ?? '',
    autoReplyUnsatisfiedMessage: preferences.autoReplyUnsatisfiedMessage ?? '',
  };
  await refreshTelegramProfile();
});
onUnmounted(stopTelegramPolling);
</script>

<template>
  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
    <div class="mb-6"><h2 class="text-2xl font-black text-ink">Notifications globales</h2><p class="mt-1 font-semibold text-slate-500">Ces réglages s'appliquent à tous les QR codes, sauf désactivation spécifique sur un QR code.</p></div>

    <div class="grid gap-4 md:grid-cols-2">
      <!-- Email -->
      <label class="flex items-center justify-between gap-4 rounded-2xl bg-white p-5">
        <span class="flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Mail :size="20" /></span>
          <span><strong class="block text-ink">Email</strong><span class="text-sm font-semibold text-slate-500">Avis soumis</span></span>
        </span>
        <input v-model="notificationPreferences.emailEnabled" type="checkbox" class="h-6 w-6 accent-brand-700" />
      </label>

      <!-- Telegram -->
      <label class="flex items-center justify-between gap-4 rounded-2xl bg-white p-5">
        <span class="flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Send :size="20" /></span>
          <span><strong class="block text-ink">Telegram</strong><span class="text-sm font-semibold text-slate-500">Avis instantanés</span></span>
        </span>
        <input v-model="notificationPreferences.telegramEnabled" type="checkbox" class="h-6 w-6 accent-brand-700" />
      </label>

      <!-- Telegram connect -->
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5">
        <span class="min-w-0 font-black text-ink">
          {{ telegramProfile ? `Telegram connecté${telegramProfile.username ? ' à @' + telegramProfile.username : ''}` : 'Telegram non connecté' }}
        </span>
        <div class="flex flex-wrap gap-2">
          <button class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-3 font-black text-brand-700 transition hover:bg-brand-100" type="button" @click="connectTelegram"><Send :size="18" /> {{ telegramProfile ? 'Reconnecter' : 'Connecter Telegram' }}</button>
          <button class="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 font-black text-slate-600 transition hover:bg-slate-50" type="button" @click="refreshTelegramProfile">Actualiser</button>
        </div>
      </div>

      <label class="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 opacity-60">
        <span class="flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600"><Smartphone :size="20" /></span>
          <span>
            <strong class="flex items-center gap-2 text-ink">SMS alerte <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700">Bientôt disponible</span></strong>
            <span class="text-sm font-semibold text-slate-500">SMS si mauvais avis</span>
          </span>
        </span>
        <button type="button" class="shrink-0 cursor-not-allowed transition" disabled title="Fonctionnalité bientôt disponible">
          <component :is="ToggleLeft" :size="36" class="text-slate-300" />
        </button>
      </label>
    </div>

    <!-- SMS detail fields -->
    <div v-if="SMS_FEATURE_ENABLED && notificationPreferences.smsEnabled" class="mt-4 grid gap-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-5 sm:grid-cols-2">
      <label class="grid gap-2">
        <span class="text-xs font-black uppercase text-slate-500">Numéro du gérant (format international)</span>
        <input
          v-model="notificationPreferences.managerPhone"
          type="tel"
          placeholder="+22901234567"
          class="h-11 rounded-xl border border-slate-300 bg-white px-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100"
        />
        <span class="text-xs font-semibold text-slate-400">Ex : +22901234567 · +33612345678</span>
      </label>
      <label class="grid gap-2">
        <span class="text-xs font-black uppercase text-slate-500">Seuil d'alerte (note ≤)</span>
        <select v-model.number="notificationPreferences.badReviewThreshold" class="h-11 rounded-xl border border-slate-300 bg-white px-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100">
          <option :value="1">1 étoile</option>
          <option :value="2">2 étoiles ou moins</option>
          <option :value="3">3 étoiles ou moins</option>
        </select>
        <span class="text-xs font-semibold text-slate-400">Vous recevez un SMS si la note est ≤ ce seuil.</span>
      </label>
    </div>

    <!-- Réponse automatique au client -->
    <div class="mt-6 rounded-2xl bg-white p-5">
      <label class="flex items-center justify-between gap-4">
        <span class="flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><MessageSquareText :size="20" /></span>
          <span><strong class="block text-ink">Réponse automatique au client</strong><span class="text-sm font-semibold text-slate-500">Email envoyé automatiquement après chaque avis</span></span>
        </span>
        <button type="button" class="shrink-0 transition" @click="notificationPreferences.autoReplyEnabled = !notificationPreferences.autoReplyEnabled">
          <component :is="notificationPreferences.autoReplyEnabled ? ToggleRight : ToggleLeft" :size="36" :class="notificationPreferences.autoReplyEnabled ? 'text-brand-700' : 'text-slate-300'" />
        </button>
      </label>

      <div v-if="notificationPreferences.autoReplyEnabled" class="mt-5 grid gap-4">
        <div class="grid gap-2 sm:grid-cols-2">
          <button type="button" class="rounded-2xl border-2 p-4 text-left transition" :class="notificationPreferences.autoReplyMode === 'ai' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'" @click="notificationPreferences.autoReplyMode = 'ai'">
            <strong class="block text-ink">Réponse IA</strong>
            <span class="mt-1 block text-sm font-semibold text-slate-500">L'IA choisit la meilleure suggestion de réponse et l'envoie directement au client.</span>
          </button>
          <button type="button" class="rounded-2xl border-2 p-4 text-left transition" :class="notificationPreferences.autoReplyMode === 'manual' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white hover:bg-slate-50'" @click="notificationPreferences.autoReplyMode = 'manual'">
            <strong class="block text-ink">Réponses personnalisées</strong>
            <span class="mt-1 block text-sm font-semibold text-slate-500">Vous configurez vous-même le message selon la nature de l'avis.</span>
          </button>
        </div>

        <label class="grid gap-2">
          <span class="text-xs font-black uppercase text-slate-500">Note minimale pour qu'un avis soit considéré "satisfait"</span>
          <select v-model.number="notificationPreferences.autoReplySatisfiedThreshold" class="h-11 w-full max-w-xs rounded-xl border border-slate-300 bg-white px-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100">
            <option :value="3">3 étoiles</option>
            <option :value="4">4 étoiles</option>
            <option :value="5">5 étoiles</option>
          </select>
          <span class="text-xs font-semibold text-slate-400">En dessous de cette note, l'avis est considéré "non satisfait".</span>
        </label>

        <div v-if="notificationPreferences.autoReplyMode === 'manual'" class="grid gap-4 sm:grid-cols-2">
          <label class="grid gap-2">
            <span class="text-xs font-black uppercase text-slate-500">Message — avis satisfait</span>
            <textarea v-model="notificationPreferences.autoReplySatisfiedMessage" rows="4" placeholder="Merci pour votre avis, nous sommes ravis..." class="rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
          </label>
          <label class="grid gap-2">
            <span class="text-xs font-black uppercase text-slate-500">Message — avis non satisfait</span>
            <textarea v-model="notificationPreferences.autoReplyUnsatisfiedMessage" rows="4" placeholder="Merci pour votre retour, nous sommes désolés..." class="rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
          </label>
        </div>
      </div>
    </div>

    <p v-if="notificationMessage" class="mt-4 rounded-xl px-4 py-3 text-sm font-bold" :class="{
      'bg-emerald-50 text-emerald-700': notificationMessageType === 'success',
      'bg-red-50 text-red-700': notificationMessageType === 'error',
      'bg-sky-50 text-sky-700': notificationMessageType === 'info'
    }">{{ notificationMessage }}</p>
    <button class="mt-6 h-13 w-full rounded-xl bg-brand-700 px-5 text-base font-black text-white" @click="saveNotificationPreferences">Enregistrer</button>
  </div>
</template>
