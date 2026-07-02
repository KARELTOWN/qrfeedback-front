<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Angry, CheckCircle2, Frown, Heart, Meh, MessageSquareText, Send, Smile, Star } from 'lucide-vue-next';
import { useCompany, type CustomQuestionConfig, type FeedbackFieldConfig, type FeedbackFormConfig } from '../../composables/useCompany';
import { useReviews } from '../../composables/useReviews';
import CountryDialSelect from '../../components/CountryDialSelect.vue';
import { buildInternationalPhone, digitsOnly } from '../../constants/countries';

type CompanyPublic = {
  name: string;
  slug: string;
  feedbackUrl: string;
  feedbackFormConfig: FeedbackFormConfig;
};

const route = useRoute();
const isEmbed = computed(() => route.query.embed === '1');
const { getPublicCompany, recordPublicScan } = useCompany();
const { createReview } = useReviews();
const company = ref<CompanyPublic | null>(null);
const form = ref({
  serviceFeedback: '',
  customAnswers: [] as Array<{ questionId: string; value: string | number }>,
  rating: 0
});
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const turnstileToken = ref('');
const turnstileContainer = ref<HTMLElement | null>(null);
const loading = ref(false);
const sent = ref(false);
const error = ref('');
const redirectUrl = ref<string | null>(null);
const redirectCountdown = ref(0);
let redirectTimer: ReturnType<typeof setTimeout> | null = null;
const customPhoneDialCodes = ref<Record<string, string>>({});
const customPhoneLocalNumbers = ref<Record<string, string>>({});
const rememberMe = ref(false);
const rememberCookieName = 'qr_feedback_remember';
const stars = computed(() => [1, 2, 3, 4, 5]);
const formConfig = computed(() => company.value?.feedbackFormConfig);
const enabledFields = computed(() => formConfig.value?.fields.filter((field) => field.enabled && field.key === 'serviceFeedback') || []);
const rememberableQuestions = computed(() => (formConfig.value?.customQuestions || []).filter((question) => ['email', 'phone', 'fullName'].includes(question.type)));
const shouldShowRememberMe = computed(() => rememberableQuestions.value.length > 0);
const ratingOptions = computed(() => [
  { value: 1, label: 'Très mauvais', icon: Angry },
  { value: 2, label: 'Mauvais', icon: Frown },
  { value: 3, label: 'Correct', icon: Meh },
  { value: 4, label: 'Bon', icon: Smile },
  { value: 5, label: 'Parfait', icon: Heart }
]);

onMounted(async () => {
  company.value = await getPublicCompany(route.params.slug);
  trackScanQuietly();
  applyRememberedAnswers();
  await nextTick();
  renderTurnstile();
});

let turnstileWidgetId = '';

function scanIdempotencyKey() {
  const slug = Array.isArray(route.params.slug) ? route.params.slug.join('/') : String(route.params.slug);
  const key = `qr_feedback_scan:${slug}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const value = `${slug}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
  sessionStorage.setItem(key, value);
  return value;
}

function trackScanQuietly() {
  recordPublicScan(route.params.slug, {
    idempotencyKey: scanIdempotencyKey(),
    source: isEmbed.value ? 'embed' : 'public-form'
  }).catch(() => {
    // Le tracking ne doit jamais bloquer le formulaire d'avis.
  });
}

function loadTurnstileScript() {
  if (!turnstileSiteKey || window.turnstile) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Turnstile indisponible.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile indisponible.'));
    document.head.appendChild(script);
  });
}

async function renderTurnstile() {
  if (!turnstileSiteKey || !turnstileContainer.value) return;
  await loadTurnstileScript();
  if (!window.turnstile || turnstileWidgetId) return;
  turnstileWidgetId = window.turnstile.render(turnstileContainer.value, {
    sitekey: turnstileSiteKey,
    callback: (token: string) => {
      turnstileToken.value = token;
    },
    'expired-callback': () => {
      turnstileToken.value = '';
    },
    'error-callback': () => {
      turnstileToken.value = '';
    }
  });
}

function resetTurnstile() {
  turnstileToken.value = '';
  window.turnstile?.reset(turnstileWidgetId);
}

function fieldConfig(key: FeedbackFieldConfig['key']) {
  return enabledFields.value.find((field) => field.key === key);
}

function isFieldRequired(key: FeedbackFieldConfig['key']) {
  return Boolean(fieldConfig(key)?.required);
}

function customAnswer(question: CustomQuestionConfig) {
  let answer = form.value.customAnswers.find((item) => item.questionId === question.id);
  if (!answer) {
    answer = { questionId: question.id, value: '' };
    form.value.customAnswers.push(answer);
  }
  return answer;
}

function isCustomRequiredMissing(question: CustomQuestionConfig) {
  if (!question.required) return false;
  const value = customAnswer(question).value;
  return value === '' || value === undefined || value === null;
}

function validateCustomAnswer(question: CustomQuestionConfig) {
  const value = customAnswer(question).value;
  if (value === '' || value === undefined || value === null) return true;
  if (question.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
  if (question.type === 'phone') return /^\+[1-9]\d{7,14}$/.test(String(value).replace(/\s/g, ''));
  if (question.type === 'fullName') return String(value).trim().length >= 2;
  return true;
}

function updateCustomPhone(question: CustomQuestionConfig, localNumber: string) {
  customPhoneLocalNumbers.value[question.id] = digitsOnly(localNumber);
  const dialCode = customPhoneDialCodes.value[question.id] || '+229';
  customPhoneDialCodes.value[question.id] = dialCode;
  customAnswer(question).value = customPhoneLocalNumbers.value[question.id] ? buildInternationalPhone(dialCode, customPhoneLocalNumbers.value[question.id]) : '';
}

function updateCustomPhoneDial(question: CustomQuestionConfig, dialCode: string) {
  customPhoneDialCodes.value[question.id] = dialCode;
  updateCustomPhone(question, customPhoneLocalNumbers.value[question.id] || '');
}

function readRememberCookie() {
  const cookie = document.cookie.split('; ').find((item) => item.startsWith(`${rememberCookieName}=`));
  if (!cookie) return {};
  try {
    return JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('='))) as Record<string, string>;
  } catch {
    return {};
  }
}

function writeRememberCookie(values: Record<string, string>) {
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  document.cookie = `${rememberCookieName}=${encodeURIComponent(JSON.stringify(values))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

function splitInternationalPhone(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, '');
  const digits = cleaned.replace(/[^\d]/g, '');
  const knownDialCodes = ['+229', '+225', '+228', '+227', '+234', '+33', '+1'];
  const dialCode = knownDialCodes.find((code) => cleaned.startsWith(code)) || '+229';
  return { dialCode, localNumber: digits.slice(dialCode.replace(/[^\d]/g, '').length) };
}

function rememberKey(question: CustomQuestionConfig) {
  return `${question.type}:${question.id}`;
}

function applyRememberedAnswers() {
  const remembered = readRememberCookie();
  for (const question of rememberableQuestions.value) {
    const value = remembered[rememberKey(question)];
    if (!value) continue;
    customAnswer(question).value = value;
    if (question.type === 'phone') {
      const phone = splitInternationalPhone(value);
      customPhoneDialCodes.value[question.id] = phone.dialCode;
      customPhoneLocalNumbers.value[question.id] = phone.localNumber;
    }
    rememberMe.value = true;
  }
}

function saveRememberedAnswers() {
  if (!rememberMe.value || !shouldShowRememberMe.value) return;
  const nextValues = readRememberCookie();
  for (const question of rememberableQuestions.value) {
    const value = String(customAnswer(question).value || '').trim();
    const key = rememberKey(question);
    if (value) nextValues[key] = value;
    else delete nextValues[key];
  }
  writeRememberCookie(nextValues);
}

function startRedirectCountdown(url: string) {
  redirectUrl.value = url;
  redirectCountdown.value = 3;
  const tick = () => {
    redirectCountdown.value -= 1;
    if (redirectCountdown.value <= 0) {
      window.location.href = url;
    } else {
      redirectTimer = setTimeout(tick, 1000);
    }
  };
  redirectTimer = setTimeout(tick, 1000);
}

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    const missingField = enabledFields.value.find((field) => field.required && !String(form.value[field.key] || '').trim());
    if (missingField) throw new Error(`${missingField.label} est requis.`);
    const missingQuestion = formConfig.value?.customQuestions.find(isCustomRequiredMissing);
    if (missingQuestion) throw new Error(`${missingQuestion.label} est requis.`);
    const invalidQuestion = formConfig.value?.customQuestions.find((question) => !validateCustomAnswer(question));
    if (invalidQuestion) throw new Error(`${invalidQuestion.label} est invalide.`);
    if (turnstileSiteKey && !turnstileToken.value) throw new Error('Verification anti-robot requise.');
    const result = await createReview(route.params.slug, { ...form.value, turnstileToken: turnstileToken.value || undefined });
    saveRememberedAnswers();
    sent.value = true;
    if (result.redirectUrl) startRedirectCountdown(result.redirectUrl);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur inconnue';
    resetTurnstile();
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen bg-[#eef6f8] px-4 py-6 sm:py-10" :class="isEmbed ? 'bg-white px-0 py-0' : ''">
    <section class="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-slate-200/80 lg:grid-cols-[0.85fr_1.15fr]" :class="isEmbed ? 'max-w-none rounded-none shadow-none lg:block' : ''">
      <aside v-if="!isEmbed" class="relative min-h-56 bg-gradient-to-br from-teal-700 via-emerald-700 to-cyan-700 p-7 text-white sm:p-10" :class="sent ? 'xl:pr-16' : ''">
        <div class="relative z-10">
          <span v-if="!isEmbed" class="grid h-14 w-14 place-items-center rounded-2xl bg-white/15"><MessageSquareText :size="28" /></span>
          <p v-if="!isEmbed" class="mt-8 text-sm font-black uppercase tracking-wide text-emerald-100">{{ company?.name || 'QR Feedback' }}</p>
          <h1 class="mt-3 max-w-md text-4xl font-black leading-tight sm:text-5xl lg:text-4xl xl:text-5xl" :class="isEmbed ? 'mt-0 text-xl leading-tight sm:text-2xl' : ''">{{ formConfig?.welcomeTitle || "Un avis aujourd’hui, une meilleure expérience demain." }}</h1>
        </div>
        <div v-if="!sent" class="absolute bottom-6 right-6 hidden max-w-52 rounded-3xl bg-white/12 p-5 backdrop-blur xl:block">
          <Star class="text-amber-200" :size="36" />
          <p class="mt-3 max-w-52 font-bold text-white/90">{{ formConfig?.welcomeMessage || "Votre partage d'expérience nous aide à mieux vous servir." }}</p>
        </div>
      </aside>

      <form v-if="!sent" class="grid gap-6 p-5 sm:p-8 lg:p-10" :class="isEmbed ? 'gap-4 p-5 sm:p-6' : ''" @submit.prevent="submit">
        <div>
          <h2 class="text-3xl font-black text-ink" :class="isEmbed ? 'text-2xl' : ''">{{ formConfig?.title || 'Comment s’est passée votre expérience ?' }}</h2>
          <p class="mt-2 font-semibold text-slate-500" :class="isEmbed ? 'text-sm' : ''">Nous lirons votre retour avec attention.</p>
        </div>

        <section class="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="font-black text-ink">Votre note *</span>
          </div>
          <div class="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
            <button v-for="option in ratingOptions" :key="option.value" type="button" class="grid aspect-square min-h-14 place-items-center rounded-2xl border text-ink transition hover:-translate-y-0.5" :class="form.rating === option.value ? 'border-amber-300 bg-amber-100 shadow-md shadow-amber-100' : 'border-white bg-white hover:border-slate-200'" @click="form.rating = option.value">
              <component :is="option.icon" :size="28" :fill="option.value === 5 && form.rating === option.value ? 'currentColor' : 'none'" />
            </button>
          </div>
          <div class="mt-3 flex justify-between text-sm font-black text-slate-500"><span>Déçu</span><span>Enchanté</span></div>
        </section>

        <label v-if="fieldConfig('serviceFeedback')" class="block">
          <span class="mb-2 block font-extrabold text-ink">{{ fieldConfig('serviceFeedback')?.label }} <span v-if="isFieldRequired('serviceFeedback')" class="text-red-600">*</span></span>
          <textarea v-model="form.serviceFeedback" :required="isFieldRequired('serviceFeedback')" :placeholder="fieldConfig('serviceFeedback')?.placeholder || 'Dites-nous ce qui vous a marqué...'" rows="4" class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
        </label>

        <div class="grid gap-5">
          <label v-for="question in formConfig?.customQuestions || []" :key="question.id" class="block">
            <span class="mb-2 block font-extrabold text-ink">{{ question.label }} <span v-if="question.required" class="text-red-600">*</span></span>
            <input v-if="question.type === 'text'" v-model="customAnswer(question).value" :required="question.required" :placeholder="question.placeholder" class="h-13 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
            <input v-else-if="question.type === 'fullName'" v-model.trim="customAnswer(question).value" :required="question.required" autocomplete="name" :placeholder="question.placeholder || 'Votre nom et prénoms'" class="h-13 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
            <textarea v-else-if="question.type === 'textarea'" v-model="customAnswer(question).value" :required="question.required" :placeholder="question.placeholder" rows="3" class="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
            <input v-else-if="question.type === 'email'" v-model.trim="customAnswer(question).value" type="email" autocomplete="email" :required="question.required" :placeholder="question.placeholder || 'contact@entreprise.com'" class="h-13 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
            <div v-else-if="question.type === 'phone'" class="grid gap-3 sm:grid-cols-[150px_1fr]">
              <CountryDialSelect :model-value="customPhoneDialCodes[question.id] || '+229'" @update:model-value="updateCustomPhoneDial(question, $event)" />
              <input :value="customPhoneLocalNumbers[question.id] || ''" :required="question.required" inputmode="numeric" pattern="[0-9]*" autocomplete="tel" :placeholder="question.placeholder || '0199997478'" class="h-14 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" @input="updateCustomPhone(question, ($event.target as HTMLInputElement).value)" />
            </div>
            <select v-else-if="question.type === 'select'" v-model="customAnswer(question).value" :required="question.required" class="h-13 w-full rounded-2xl border border-slate-200 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100">
              <option value="">Choisir une option</option>
              <option v-for="option in question.options || []" :key="option" :value="option">{{ option }}</option>
            </select>
            <div v-else class="flex flex-wrap gap-2">
              <button v-for="star in stars" :key="`${question.id}-${star}`" type="button" class="grid h-11 w-11 place-items-center rounded-xl border transition" :class="Number(customAnswer(question).value) >= star ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-slate-200 bg-white text-slate-300'" @click="customAnswer(question).value = star">
                <Star :size="24" />
              </button>
            </div>
          </label>
        </div>

        <label v-if="shouldShowRememberMe" class="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3 font-bold text-ink">
          <input v-model="rememberMe" type="checkbox" class="mt-1 h-5 w-5 rounded border-slate-300 text-brand-700 focus:ring-brand-500" />
          <span>Se souvenir de mes informations</span>
        </label>

        <div v-if="turnstileSiteKey" class="rounded-2xl border border-slate-200 bg-white p-3">
          <div ref="turnstileContainer"></div>
        </div>

        <button class="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 text-base font-black text-white transition hover:bg-brand-600 disabled:opacity-60" :disabled="loading || !form.rating">
          <Send :size="19" /> {{ loading ? 'Envoi...' : 'Envoyer mon avis' }}
        </button>
        <p v-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{{ error }}</p>
      </form>

      <div v-else class="grid place-items-center p-8 text-center sm:p-12">
        <div class="max-w-md">
          <span class="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 :size="42" /></span>
          <h1 class="mt-6 text-4xl font-black text-ink">Merci pour votre avis.</h1>
          <p class="mt-3 text-lg font-semibold leading-8 text-slate-500">Votre retour a bien été transmis. Il aidera l’équipe à améliorer l’expérience des prochains clients.</p>

          <div v-if="redirectUrl" class="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5">
            <p class="font-black text-emerald-800">Votre avis compte vraiment !</p>
            <p class="mt-1 text-sm font-semibold text-emerald-700">Vous allez être redirigé pour laisser un avis public dans <strong>{{ redirectCountdown }}s</strong>…</p>
            <a :href="redirectUrl" class="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 font-black text-white transition hover:bg-emerald-600">
              Laisser un avis public maintenant
            </a>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>




