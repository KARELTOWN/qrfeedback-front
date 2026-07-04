<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { ArrowRight, Building2, CheckCircle2, Copy, Download, Mail, MessageCircle, QrCode, Sparkles, X } from 'lucide-vue-next';
import { useCompany, type PublicProof, type RegisterCompanyResult } from '../../composables/useCompany';

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

const { registerCompany, getPublicProof } = useCompany();
const form = ref({ name: '', email: '' });
const result = ref<RegisterCompanyResult | null>(null);
const publicProof = ref<PublicProof>({ companiesCount: 0, reviewsCount: 0, trusts: [] });
const loading = ref(false);
const error = ref('');
const copyMessage = ref('');
const displayedCompaniesCount = ref(0);
const displayedReviewsCount = ref(0);
const trustClosed = ref(false);
const visibleTrustIndex = ref(0);
let trustTimer: ReturnType<typeof window.setInterval> | undefined;
let counterFrame: number | undefined;
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
const turnstileContainer = ref<HTMLElement | null>(null);
const turnstileToken = ref('');
const turnstileWidgetId = ref('');
const visibleTrust = computed(() => publicProof.value.trusts[visibleTrustIndex.value]);

function formatCount(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value);
}

function animateCounters(companiesTarget: number, reviewsTarget: number) {
  if (counterFrame) window.cancelAnimationFrame(counterFrame);

  const startCompanies = displayedCompaniesCount.value;
  const startReviews = displayedReviewsCount.value;
  const startedAt = performance.now();
  const duration = 850;

  function tick(now: number) {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    displayedCompaniesCount.value = Math.round(startCompanies + (companiesTarget - startCompanies) * eased);
    displayedReviewsCount.value = Math.round(startReviews + (reviewsTarget - startReviews) * eased);

    if (progress < 1) {
      counterFrame = window.requestAnimationFrame(tick);
      return;
    }

    displayedCompaniesCount.value = companiesTarget;
    displayedReviewsCount.value = reviewsTarget;
  }

  counterFrame = window.requestAnimationFrame(tick);
}

function formatTrustTime(value: string) {
  const createdAt = new Date(value).getTime();
  const diffMs = Math.max(Date.now() - createdAt, 0);
  const diffHours = Math.max(1, Math.floor(diffMs / (60 * 60 * 1000)));
  if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;

  const diffDays = Math.max(1, Math.floor(diffHours / 24));
  return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
}

async function loadPublicProof() {
  try {
    publicProof.value = await getPublicProof();
    animateCounters(publicProof.value.companiesCount, publicProof.value.reviewsCount);
    visibleTrustIndex.value = 0;
    if (trustTimer) window.clearInterval(trustTimer);
    trustTimer = window.setInterval(() => {
      if (!publicProof.value.trusts.length) return;
      visibleTrustIndex.value = (visibleTrustIndex.value + 1) % publicProof.value.trusts.length;
    }, 5200);
  } catch {
    publicProof.value = { companiesCount: 0, reviewsCount: 0, trusts: [] };
    animateCounters(0, 0);
  }
}

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Turnstile indisponible.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile indisponible.'));
    document.head.appendChild(script);
  });
}

async function renderTurnstile() {
  if (!turnstileSiteKey || !turnstileContainer.value || turnstileWidgetId.value) return;

  try {
    await loadTurnstileScript();
    turnstileWidgetId.value = window.turnstile?.render(turnstileContainer.value, {
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
    }) || '';
  } catch {
    error.value = 'Impossible de charger la verification anti-robot.';
  }
}

function resetTurnstile() {
  turnstileToken.value = '';
  if (turnstileWidgetId.value) window.turnstile?.reset(turnstileWidgetId.value);
}

async function submit() {
  if (turnstileSiteKey && !turnstileToken.value) {
    error.value = 'Veuillez valider la verification anti-robot.';
    return;
  }

  loading.value = true;
  error.value = '';
  try {
    result.value = await registerCompany({
      name: form.value.name,
      email: form.value.email,
      turnstileToken: turnstileToken.value || undefined
    });
    await loadPublicProof();
    resetTurnstile();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur inconnue';
    resetTurnstile();
  } finally {
    loading.value = false;
  }
}

async function copyText(value: string) {
  copyMessage.value = '';
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const input = document.createElement('textarea');
    input.value = value;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
  copyMessage.value = 'Lien copié.';
}

function downloadQrCode(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

onMounted(async () => {
  await nextTick();
  await loadPublicProof();
  await renderTurnstile();
});

onBeforeUnmount(() => {
  if (counterFrame) window.cancelAnimationFrame(counterFrame);
  if (trustTimer) window.clearInterval(trustTimer);
  if (turnstileWidgetId.value) window.turnstile?.remove(turnstileWidgetId.value);
});
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <RouterLink to="/" class="flex items-center" aria-label="Opinbase">
          <img :src="'/assets/logo-horizontal.png'" alt="Opinbase" class="h-8 w-auto max-w-[130px] object-contain sm:h-10 sm:max-w-[160px]" />
        </RouterLink>
        <nav class="flex items-center gap-2 text-xs font-bold text-brand-700 sm:gap-4 sm:text-sm">
          <RouterLink to="/fonctionnalites" class="hidden sm:inline">Fonctionnalités</RouterLink>
          <RouterLink to="/communaute" class="hidden sm:inline">Communauté</RouterLink>
          <RouterLink
            to="/bot"
            class="hidden items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-brand-700 transition hover:bg-brand-100 sm:inline-flex"
          >
            <MessageCircle :size="15" />
            Bot Telegram
          </RouterLink>
          <RouterLink to="/login" class="rounded-lg px-2 py-1.5 sm:px-0 sm:py-0">Connexion</RouterLink>
          <RouterLink to="/signup" class="rounded-lg bg-brand-700 px-2.5 py-1.5 text-white sm:bg-transparent sm:px-0 sm:py-0 sm:text-brand-700">Créer un compte</RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
      <section class="flex flex-col justify-center">
        <h1 class="max-w-2xl text-4xl font-black leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
          Collectez les avis clients.
          <span class="mt-2 block text-brand-700">Décidez plus vite.</span>
        </h1>
        <p class="mt-6 max-w-xl text-base font-semibold leading-7 text-slate-600 sm:text-lg sm:leading-8">
          Recevez chaque nouvel avis directement dans votre boîte mail et transformez les retours clients en actions concrètes.
        </p>

        <div class="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
          <div class="flex items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 text-center shadow-sm sm:justify-start sm:text-left">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
              <Building2 :size="21" />
            </span>
            <span>
              <strong class="block text-3xl font-black leading-none text-ink">{{ formatCount(displayedCompaniesCount) }}</strong>
              <span class="mt-1 block text-sm font-black text-slate-500">Entreprises ont généré un QR CODE</span>
            </span>
          </div>
          <div class="flex items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 text-center shadow-sm sm:justify-start sm:text-left">
            <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
              <MessageCircle :size="21" />
            </span>
            <span>
              <strong class="block text-3xl font-black leading-none text-ink">{{ formatCount(displayedReviewsCount) }}</strong>
              <span class="mt-1 block text-sm font-black text-slate-500">Avis récoltés</span>
            </span>
          </div>
        </div>

        <div class="mt-9 flex flex-wrap gap-3">
          <span class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-extrabold text-ink shadow-sm">
            <QrCode :size="18" /> QR Code automatique
          </span>
          <span class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-extrabold text-ink shadow-sm">
            <MessageCircle :size="18" />Bot Telegram
          </span>
          <span class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-extrabold text-ink shadow-sm">
            <Mail :size="18" /> Notifications email instantanées
          </span>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
        <form class="space-y-6" @submit.prevent="submit">
          <div>
            <h2 class="text-3xl font-black text-ink">Créez votre QR Code</h2>
            <p class="mt-2 text-sm font-medium text-slate-500">Aucun compte requis pour commencer.</p>
          </div>

          <label class="block">
            <span class="mb-2 block text-base font-extrabold text-ink">Nom de l'entreprise</span>
            <input v-model="form.name" required placeholder="Ex. Restaurant Le Palmier" class="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-ink outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
          </label>
          <label class="block">
            <span class="mb-2 block text-base font-extrabold text-ink">Email</span>
            <input v-model="form.email" required type="email" placeholder="contact@entreprise.com" class="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-base font-semibold text-ink outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
          </label>
          <div v-if="turnstileSiteKey" class="min-h-[65px]">
            <div ref="turnstileContainer"></div>
          </div>

          <button class="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 text-base font-black text-white shadow-lg shadow-emerald-900/10 transition hover:bg-brand-600 disabled:opacity-60" :disabled="loading">
            {{ loading ? 'Création...' : 'Générer mon QR Code' }}
            <ArrowRight :size="18" />
          </button>
          <p v-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{{ error }}</p>
        </form>
      </section>
    </main>

    <section v-if="result" class="mx-auto grid max-w-7xl gap-6 px-4 pb-14 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-center gap-3 text-brand-700">
          <CheckCircle2 :size="24" />
          <h2 class="text-2xl font-black text-ink">{{ result.name }}</h2>
        </div>
        <p class="mb-3 font-semibold text-slate-600">Lien unique envoyé par email avec le QR Code.</p>
        <a :href="result.feedbackUrl" target="_blank" class="break-all text-base font-black text-brand-700">{{ result.feedbackUrl }}</a>
        <div class="mt-5 flex flex-wrap gap-3">
          <button class="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 font-black text-ink" @click="copyText(result.feedbackUrl)">
            <Copy :size="17" /> Copier le lien
          </button>
          <button class="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 font-black text-white" @click="downloadQrCode(result.qrCodeDataUrl, `qr-code-${result.slug}.png`)">
            <Download :size="17" /> Télécharger le QR Code
          </button>
        </div>
        <p v-if="copyMessage" class="mt-3 text-sm font-bold text-brand-700">{{ copyMessage }}</p>
      </div>
      <div class="grid place-items-center rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <img :src="result.qrCodeDataUrl" alt="QR Code" class="h-56 w-56 rounded-xl" />
      </div>
    </section>

    <aside v-if="visibleTrust && !trustClosed" class="fixed bottom-5 left-4 z-30 w-[calc(100%-2rem)] max-w-sm sm:left-6 sm:w-[380px]">
      <Transition name="trust-slide" mode="out-in">
        <div
          :key="visibleTrust.id"
          class="rounded-[28px] border border-slate-200 bg-white/95 p-3 shadow-2xl shadow-slate-300/60 backdrop-blur"
        >
          <div class="flex items-center gap-3">
            <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <Sparkles :size="22" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-black text-ink">{{ visibleTrust.companyName }}</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-600">a demande un QR Code</p>
              <div class="mt-1 flex items-center gap-2">
                <span class="text-xs font-bold text-slate-500">{{ formatTrustTime(visibleTrust.createdAt) }}</span>
              </div>
            </div>
            <button class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-ink" aria-label="Fermer" @click="trustClosed = true">
              <X :size="18" />
            </button>
          </div>
        </div>
      </Transition>
    </aside>
  </div>
</template>

<style scoped>
.trust-slide-enter-active,
.trust-slide-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.trust-slide-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.trust-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}
</style>
