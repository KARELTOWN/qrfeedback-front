<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { ArrowUpRight, Check, Code2, ExternalLink, Lock, Mail, MessageSquareText, Send, Smartphone, ToggleLeft, ToggleRight } from 'lucide-vue-next';
import FeedbackFormSettings from '../../components/user/FeedbackFormSettings.vue';
import PasswordField from '../../components/PasswordField.vue';
import { useAuth } from '../../composables/useAuth';
import { useDashboard, type CompanyQrCode, type FeedbackFormConfig, type NotificationPreferences, type ReviewRedirectConfig, type TelegramProfile } from '../../composables/useDashboard';
import { useToast } from '../../composables/useToast';
import { changePasswordSchema, validateForm, type FormErrors } from '../../validators/auth.validator';

type SettingsTab = 'feedback-form' | 'notifications' | 'redirect' | 'password' | 'testimonials-widget';
type ChangePasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string };
type TestimonialsSource = 'company' | string;

const { changePassword } = useAuth();
const { getFeedbackFormConfig, updateFeedbackFormConfig, getNotificationPreferences, updateNotificationPreferences, getReviewRedirectConfig, updateReviewRedirectConfig, getTelegramLink, getTelegramProfile, getStats, getQrCodes } = useDashboard();
const { showToast } = useToast();
const settingsTab = ref<SettingsTab>('feedback-form');
const formConfig = ref<FeedbackFormConfig | null>(null);
const formConfigMessage = ref('');
const notificationPreferences = ref<NotificationPreferences>({ emailEnabled: true, telegramEnabled: true, smsEnabled: false, managerPhone: null, badReviewThreshold: 2 });
const telegramProfile = ref<TelegramProfile | null>(null);
const notificationMessage = ref('');
const notificationMessageType = ref<'success' | 'error' | 'info'>('info');
const redirectConfig = ref<ReviewRedirectConfig>({ enabled: false, goodRatingThreshold: 4, redirectUrl: null });
const redirectMessage = ref('');
const redirectMessageType = ref<'success' | 'error'>('success');
const redirectUrlInput = ref('');
const passwordForm = ref<ChangePasswordForm>({ currentPassword: '', newPassword: '', confirmPassword: '' });
const passwordErrors = ref<FormErrors<ChangePasswordForm>>({});
let telegramPollTimer: ReturnType<typeof setInterval> | null = null;

const companySlug = ref('');
const qrCodes = ref<CompanyQrCode[]>([]);
const testimonialsSource = ref<TestimonialsSource>('company');
const snippetCopied = ref(false);
const activeTestimonialsSlug = computed(() => {
  if (testimonialsSource.value === 'company') return companySlug.value;
  return qrCodes.value.find((qr) => qr._id === testimonialsSource.value)?.slug || '';
});
const testimonialsEmbedUrl = computed(() => `${window.location.origin}/temoignages/${activeTestimonialsSlug.value}`);
const testimonialsSnippet = computed(() => {
  const url = testimonialsEmbedUrl.value;
  const id = `qrf-${activeTestimonialsSlug.value}`;
  return [
    `<iframe src="${url}" id="${id}" width="100%" height="260" style="border:0;overflow:hidden;" loading="lazy" scrolling="no" title="Avis clients"></iframe>`,
    `<script>window.addEventListener('message',function(e){if(e.data&&e.data.type==='qr-feedback-widget-resize'){var f=document.getElementById('${id}');if(f)f.style.height=e.data.height+'px'}})<\/script>`,
  ].join('\n');
});

async function loadTestimonialsWidgetData() {
  const [stats, qrCodesResult] = await Promise.all([getStats(), getQrCodes(1, 100)]);
  companySlug.value = stats.company.slug;
  qrCodes.value = qrCodesResult.qrCodes.filter((qr) => qr.isActive !== false);
}

async function copyTestimonialsSnippet() {
  try {
    await navigator.clipboard.writeText(testimonialsSnippet.value);
  } catch {
    const input = document.createElement('textarea');
    input.value = testimonialsSnippet.value;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
  snippetCopied.value = true;
  showToast('Code d\'intégration copié.', 'success');
  setTimeout(() => { snippetCopied.value = false; }, 2000);
}

async function saveFormConfig() {
  if (!formConfig.value) return;
  formConfigMessage.value = '';
  try {
    formConfig.value = await updateFeedbackFormConfig(formConfig.value);
    formConfigMessage.value = 'Configuration enregistrée.';
  } catch (err) { formConfigMessage.value = err instanceof Error ? err.message : 'Erreur inconnue'; }
}

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

async function saveRedirectConfig() {
  redirectMessage.value = '';
  try {
    const updated = await updateReviewRedirectConfig({
      ...redirectConfig.value,
      redirectUrl: redirectUrlInput.value.trim() || null,
    });
    redirectConfig.value = updated;
    redirectUrlInput.value = updated.redirectUrl ?? '';
    redirectMessage.value = 'Configuration enregistrée.';
    redirectMessageType.value = 'success';
  } catch (err) {
    redirectMessage.value = err instanceof Error ? err.message : 'Erreur inconnue';
    redirectMessageType.value = 'error';
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
async function submitPasswordChange() {
  passwordErrors.value = await validateForm(changePasswordSchema, passwordForm.value);
  if (Object.keys(passwordErrors.value).length) return;
  try {
    await changePassword({ currentPassword: passwordForm.value.currentPassword, newPassword: passwordForm.value.newPassword });
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    showToast('Mot de passe modifié avec succès.', 'success');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    if (message.toLowerCase().includes('actuel') || message.toLowerCase().includes('incorrect')) { passwordErrors.value.currentPassword = message; return; }
    if (message.toLowerCase().includes('nouveau')) { passwordErrors.value.newPassword = message; return; }
    showToast(message, 'error');
  }
}
async function load() {
  const [config, preferences, redirect] = await Promise.all([getFeedbackFormConfig(), getNotificationPreferences(), getReviewRedirectConfig()]);
  formConfig.value = config;
  notificationPreferences.value = {
    emailEnabled: preferences.emailEnabled ?? true,
    telegramEnabled: preferences.telegramEnabled ?? true,
    smsEnabled: preferences.smsEnabled ?? false,
    managerPhone: preferences.managerPhone ?? null,
    badReviewThreshold: preferences.badReviewThreshold ?? 2,
  };
  redirectConfig.value = redirect;
  redirectUrlInput.value = redirect.redirectUrl ?? '';
  await refreshTelegramProfile();
}
onMounted(load);
onMounted(loadTestimonialsWidgetData);
onUnmounted(stopTelegramPolling);
</script>

<template>
  <section class="grid gap-6">
    <div class="inline-flex w-fit flex-wrap gap-1 rounded-2xl border border-slate-300 bg-white p-1">
      <button class="h-11 rounded-xl px-4 text-sm font-black transition" :class="settingsTab === 'feedback-form' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'" @click="settingsTab = 'feedback-form'">Formulaire</button>
      <button class="h-11 rounded-xl px-4 text-sm font-black transition" :class="settingsTab === 'notifications' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'" @click="settingsTab = 'notifications'">Notifications</button>
      <button class="h-11 rounded-xl px-4 text-sm font-black transition" :class="settingsTab === 'redirect' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'" @click="settingsTab = 'redirect'">Redirection avis</button>
      <button class="h-11 rounded-xl px-4 text-sm font-black transition" :class="settingsTab === 'password' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'" @click="settingsTab = 'password'">Mot de passe</button>
      <button class="h-11 rounded-xl px-4 text-sm font-black transition" :class="settingsTab === 'testimonials-widget' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'" @click="settingsTab = 'testimonials-widget'">Widget témoignages</button>
    </div>

    <FeedbackFormSettings v-if="settingsTab === 'feedback-form'" :model-value="formConfig" :message="formConfigMessage" @save="saveFormConfig" />

    <!-- ===== NOTIFICATIONS ===== -->
    <div v-if="settingsTab === 'notifications'" class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
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

        <!-- SMS alerte gérant -->
        <label class="flex items-center justify-between gap-4 rounded-2xl bg-white p-5">
          <span class="flex items-center gap-3">
            <span class="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-600"><Smartphone :size="20" /></span>
            <span><strong class="block text-ink">SMS alerte gérant</strong><span class="text-sm font-semibold text-slate-500">SMS si mauvais avis</span></span>
          </span>
          <button type="button" class="shrink-0 transition" @click="notificationPreferences.smsEnabled = !notificationPreferences.smsEnabled">
            <component :is="notificationPreferences.smsEnabled ? ToggleRight : ToggleLeft" :size="36" :class="notificationPreferences.smsEnabled ? 'text-brand-700' : 'text-slate-300'" />
          </button>
        </label>
      </div>

      <!-- SMS detail fields -->
      <div v-if="notificationPreferences.smsEnabled" class="mt-4 grid gap-4 rounded-2xl border border-rose-100 bg-rose-50/50 p-5 sm:grid-cols-2">
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

      <p v-if="notificationMessage" class="mt-4 rounded-xl px-4 py-3 text-sm font-bold" :class="{
        'bg-emerald-50 text-emerald-700': notificationMessageType === 'success',
        'bg-red-50 text-red-700': notificationMessageType === 'error',
        'bg-sky-50 text-sky-700': notificationMessageType === 'info'
      }">{{ notificationMessage }}</p>
      <button class="mt-6 h-13 w-full rounded-xl bg-brand-700 px-5 text-base font-black text-white" @click="saveNotificationPreferences">Enregistrer</button>
    </div>

    <!-- ===== REDIRECTION INTELLIGENTE ===== -->
    <div v-if="settingsTab === 'redirect'" class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div class="mb-6 flex items-center gap-3">
        <span class="grid h-12 w-12 place-items-center rounded-full bg-brand-700 text-white"><ArrowUpRight :size="22" /></span>
        <div>
          <h2 class="text-2xl font-black text-ink">Redirection intelligente</h2>
          <p class="mt-1 font-semibold text-slate-500">Les bons avis sont redirigés vers votre page Google/Truspilot.... Les mauvais restent en interne.</p>
        </div>
      </div>

      <div class="grid gap-5">
        <!-- Toggle activation -->
        <div class="flex items-center justify-between rounded-2xl bg-white p-5">
          <div class="flex items-center gap-3">
            <span class="grid h-10 w-10 place-items-center rounded-xl" :class="redirectConfig.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'">
              <ExternalLink :size="18" />
            </span>
            <div>
              <strong class="block text-ink">Redirection des avis</strong>
              <span class="text-sm font-semibold text-slate-500">{{ redirectConfig.enabled ? 'Les bons avis sont redirigés vers Google' : 'Tous les avis restent en interne' }}</span>
            </div>
          </div>
          <button type="button" class="shrink-0 transition" @click="redirectConfig.enabled = !redirectConfig.enabled">
            <component :is="redirectConfig.enabled ? ToggleRight : ToggleLeft" :size="36" :class="redirectConfig.enabled ? 'text-brand-700' : 'text-slate-300'" />
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <!-- URL Google -->
          <label class="grid gap-2">
            <span class="text-xs font-black uppercase text-slate-500">URL de redirection (Google, TripAdvisor…)</span>
            <div class="relative">
              <ExternalLink class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="16" />
              <input
                v-model="redirectUrlInput"
                type="url"
                placeholder="https://g.page/r/votre-id/review"
                class="h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100"
              />
            </div>
            <a v-if="redirectUrlInput" :href="redirectUrlInput" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
              <ExternalLink :size="12" /> Tester le lien
            </a>
          </label>

          <!-- Seuil note positive -->
          <label class="grid gap-2">
            <span class="text-xs font-black uppercase text-slate-500">Seuil de bon avis (note ≥)</span>
            <select v-model.number="redirectConfig.goodRatingThreshold" class="h-11 rounded-xl border border-slate-300 bg-white px-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100">
              <option :value="3">3 étoiles et plus</option>
              <option :value="4">4 étoiles et plus</option>
              <option :value="5">5 étoiles uniquement</option>
            </select>
            <span class="text-xs font-semibold text-slate-400">En dessous de ce seuil, l'avis reste sur votre tableau de bord.</span>
          </label>
        </div>

        <!-- Visual recap -->
        <div class="rounded-2xl border border-slate-200 bg-white p-4">
          <p class="mb-3 text-xs font-black uppercase text-slate-500">Fonctionnement</p>
          <div class="grid gap-2 sm:grid-cols-2">
            <div class="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
              <span class="text-xl">⭐</span>
              <div>
                <strong class="block text-sm text-emerald-700">Note ≥ {{ redirectConfig.goodRatingThreshold }}</strong>
                <span class="text-xs font-semibold text-emerald-600">→ Redirigé vers Google</span>
              </div>
            </div>
            <div class="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3">
              <span class="text-xl">💬</span>
              <div>
                <strong class="block text-sm text-rose-700">Note &lt; {{ redirectConfig.goodRatingThreshold }}</strong>
                <span class="text-xs font-semibold text-rose-600">→ Reste dans votre dashboard</span>
              </div>
            </div>
          </div>
        </div>

        <p v-if="redirectMessage" class="rounded-xl px-4 py-3 text-sm font-bold" :class="redirectMessageType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ redirectMessage }}</p>
        <button class="h-13 w-full rounded-xl bg-brand-700 px-5 text-base font-black text-white" @click="saveRedirectConfig">Enregistrer</button>
      </div>
    </div>

    <!-- ===== MOT DE PASSE ===== -->
    <div v-if="settingsTab === 'password'" class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div class="mb-6 flex items-center gap-3"><span class="grid h-12 w-12 place-items-center rounded-full bg-brand-700 text-white"><Lock :size="22" /></span><div><h2 class="text-2xl font-black text-ink">Changer le mot de passe</h2><p class="mt-1 font-semibold text-slate-500">Renseignez l'ancien mot de passe puis confirmez le nouveau.</p></div></div>
      <form class="grid max-w-2xl gap-5" @submit.prevent="submitPasswordChange"><label class="block"><span class="mb-2 block font-black text-ink">Ancien mot de passe</span><PasswordField v-model="passwordForm.currentPassword" input-class="h-13" /><span v-if="passwordErrors.currentPassword" class="mt-2 block text-sm font-bold text-red-600">{{ passwordErrors.currentPassword }}</span></label><label class="block"><span class="mb-2 block font-black text-ink">Nouveau mot de passe</span><PasswordField v-model="passwordForm.newPassword" placeholder="Nouveau mot de passe" input-class="h-13" /><span v-if="passwordErrors.newPassword" class="mt-2 block text-sm font-bold text-red-600">{{ passwordErrors.newPassword }}</span></label><label class="block"><span class="mb-2 block font-black text-ink">Confirmation</span><PasswordField v-model="passwordForm.confirmPassword" placeholder="Confirmation" input-class="h-13" /><span v-if="passwordErrors.confirmPassword" class="mt-2 block text-sm font-bold text-red-600">{{ passwordErrors.confirmPassword }}</span></label><button class="h-13 rounded-xl bg-brand-700 px-5 font-black text-white">Mettre à jour</button></form>
    </div>

    <!-- ===== WIDGET TÉMOIGNAGES ===== -->
    <div v-if="settingsTab === 'testimonials-widget'" class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div class="mb-6 flex items-center gap-3">
        <span class="grid h-12 w-12 place-items-center rounded-full bg-brand-700 text-white"><Code2 :size="22" /></span>
        <div>
          <h2 class="text-2xl font-black text-ink">Widget témoignages</h2>
          <p class="mt-1 font-semibold text-slate-500">Affichez un carrousel de vos avis publiés sur votre propre site web, via une iframe à intégrer.</p>
        </div>
      </div>

      <div class="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div class="grid gap-4">
          <label class="block">
            <span class="mb-2 block font-black text-ink">Avis à afficher</span>
            <select v-model="testimonialsSource" class="h-13 w-full rounded-xl border border-slate-300 bg-white px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100">
              <option value="company">Tous les avis de l'entreprise</option>
              <option v-for="qr in qrCodes" :key="qr._id" :value="qr._id">{{ qr.label || qr.slug }}</option>
            </select>
          </label>
          <p class="font-semibold text-slate-500">
            Le widget tourne automatiquement entre vos avis publiés et s'adapte à la largeur de son conteneur.
          </p>
        </div>

        <div class="grid min-w-0 gap-4">
          <div class="rounded-2xl border border-slate-200 bg-white p-4">
            <span class="mb-2 block text-sm font-black uppercase text-slate-500">Code à coller sur votre site</span>
            <pre class="max-h-24 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-slate-900 p-3 text-xs font-mono leading-5 text-emerald-200">{{ testimonialsSnippet }}</pre>
            <button class="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 font-black text-white transition hover:bg-brand-600" type="button" @click="copyTestimonialsSnippet">
              <component :is="snippetCopied ? Check : Code2" :size="18" />
              {{ snippetCopied ? 'Copié !' : 'Copier le code' }}
            </button>
          </div>
          <a class="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 font-black text-ink transition hover:bg-white" :href="testimonialsEmbedUrl" target="_blank" rel="noreferrer">
            Prévisualiser le widget
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
