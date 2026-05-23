<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Bot,
  Code2,
  Copy,
  Download,
  Eye,
  Home,
  Inbox,
  LineChart,
  Lock,
  MessageSquareText,
  Plus,
  QrCode,
  Settings,
  Smartphone,
  Star,
  Workflow,
  X
} from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth';
import {
  useDashboard,
  type CompanyQrCode,
  type DashboardStats,
  type FeedbackFormConfig,
  type MonthlyEvolution,
  type PaginationMeta,
  type RatingDistribution,
  type Review
} from '../../composables/useDashboard';
import CountryDialSelect from '../../components/CountryDialSelect.vue';
import BasePagination from '../../components/shared/BasePagination.vue';
import ToastHost from '../../components/shared/ToastHost.vue';
import FeedbackFormSettings from '../../components/user/FeedbackFormSettings.vue';
import AutomationPanel from '../../components/user/AutomationPanel.vue';
import InboxPanel from '../../components/user/InboxPanel.vue';
import WhatsAppSettingsPanel from '../../components/user/WhatsAppSettingsPanel.vue';
import UserPageHeader from '../../components/user/UserPageHeader.vue';
import UserSidebar from '../../components/user/UserSidebar.vue';
import { buildInternationalPhone, digitsOnly } from '../../constants/countries';
import { changePasswordSchema, validateForm, type FormErrors } from '../../validators/auth.validator';
import PasswordField from '../../components/PasswordField.vue';
import { useToast } from '../../composables/useToast';

type DashboardTab = 'dashboard' | 'reviews' | 'qrcodes' | 'whatsapp' | 'inbox' | 'automations' | 'ai' | 'settings';
type SettingsTab = 'feedback-form' | 'password';
type ChangePasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string };

const router = useRouter();
const route = useRoute();
const { showToast } = useToast();
const { logout: clearSession, changePassword } = useAuth();
const {
  getStats,
  getReviews,
  getQrCodes,
  getMonthlyEvolution,
  getRatingDistribution,
  getFeedbackFormConfig,
  updateFeedbackFormConfig,
  createQrCode,
  exportReviewsCsv
} = useDashboard();

const activeTab = ref<DashboardTab>((route.params.tab as DashboardTab) || 'dashboard');
const stats = ref<DashboardStats | null>(null);
const reviews = ref<Review[]>([]);
const qrCodes = ref<CompanyQrCode[]>([]);
const emptyPagination: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
const reviewPagination = ref<PaginationMeta>(emptyPagination);
const qrCodePagination = ref<PaginationMeta>(emptyPagination);
const reviewPage = ref(1);
const qrCodePage = ref(1);
const pageSize = 10;
const selectedReview = ref<Review | null>(null);
const monthlyEvolution = ref<MonthlyEvolution[]>([]);
const ratingDistribution = ref<RatingDistribution>([]);
const selectedYears = ref<number[]>([new Date().getFullYear()]);
const comparisonYear = ref(new Date().getFullYear() - 1);
const ratingFilter = ref({ startDate: '', endDate: '' });
const qrForm = ref({ countryDialCode: '+229', whatsappLocalNumber: '', label: '' });
const passwordForm = ref<ChangePasswordForm>({ currentPassword: '', newPassword: '', confirmPassword: '' });
const passwordErrors = ref<FormErrors<ChangePasswordForm>>({});
const error = ref('');
const qrMessage = ref('');
const formConfig = ref<FeedbackFormConfig | null>(null);
const formConfigMessage = ref('');
const settingsTab = ref<SettingsTab>('feedback-form');

const navItems: Array<{ key: DashboardTab; label: string; icon: typeof Home; badge?: string }> = [
  { key: 'dashboard', label: 'Tableau de bord', icon: Home },
  { key: 'reviews', label: 'Avis clients', icon: MessageSquareText },
  { key: 'qrcodes', label: 'QR Code', icon: QrCode },
  { key: 'whatsapp', label: 'WhatsApp', icon: Smartphone },
  { key: 'inbox', label: 'Inbox', icon: Inbox },
  { key: 'automations', label: 'Automations', icon: Workflow },
  { key: 'ai', label: 'Analyse IA', icon: Bot, badge: 'Bientôt' },
  { key: 'settings', label: 'Réglages', icon: Settings }
];

const pageTitle = computed(() => navItems.find((item) => item.key === activeTab.value)?.label || 'Dashboard');
const reviewTotalPages = computed(() => reviewPagination.value.totalPages);
const qrCodeTotalPages = computed(() => qrCodePagination.value.totalPages);
const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const availableYears = computed(() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, index) => current - index);
});
const maxMonthlyCount = computed(() => Math.max(1, ...monthlyEvolution.value.flatMap((serie) => serie.months.map((month) => month.count))));
const maxRatingCount = computed(() => Math.max(1, ...ratingDistribution.value.map((item) => item.count)));
const monthlyAxisTicks = computed(() => {
  const max = maxMonthlyCount.value;
  const middle = Math.ceil(max / 2);
  return [
    { value: max, y: monthlyY(max) },
    { value: middle, y: monthlyY(middle) },
    { value: 0, y: monthlyY(0) }
  ];
});

function monthlyX(index: number) {
  return 54 + index * 62;
}

function monthlyY(count: number) {
  return 190 - (count / maxMonthlyCount.value) * 150;
}

function serieColor(index: number) {
  return index === 0 ? '#0f766e' : '#f59e0b';
}

function linePoints(serie: MonthlyEvolution) {
  return serie.months
    .map((month, index) => {
      return `${monthlyX(index)},${monthlyY(month.count)}`;
    })
    .join(' ');
}

function setTab(tab: DashboardTab) {
  activeTab.value = tab;
  router.push({ path: `/dashboard/${tab}` });
}

async function loadCharts() {
  const years = Array.from(new Set([selectedYears.value[0], comparisonYear.value]));
  monthlyEvolution.value = await getMonthlyEvolution(years);
  ratingDistribution.value = await getRatingDistribution(ratingFilter.value.startDate, ratingFilter.value.endDate);
}

async function loadReviews() {
  const result = await getReviews(reviewPage.value, pageSize);
  reviews.value = result.reviews;
  reviewPagination.value = result.pagination;
}

async function loadQrCodes() {
  const result = await getQrCodes(qrCodePage.value, pageSize);
  qrCodes.value = result.qrCodes;
  qrCodePagination.value = result.pagination;
}

async function load() {
  error.value = '';
  try {
    const [statsResult, reviewsResult, qrCodesResult, formConfigResult] = await Promise.all([getStats(), getReviews(reviewPage.value, pageSize), getQrCodes(qrCodePage.value, pageSize), getFeedbackFormConfig()]);
    stats.value = statsResult;
    reviews.value = reviewsResult.reviews;
    reviewPagination.value = reviewsResult.pagination;
    qrCodes.value = qrCodesResult.qrCodes;
    qrCodePagination.value = qrCodesResult.pagination;
    formConfig.value = formConfigResult;
    await loadCharts();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur inconnue';
  }
}

async function saveFormConfig() {
  if (!formConfig.value) return;
  formConfigMessage.value = '';
  try {
    formConfig.value = await updateFeedbackFormConfig(formConfig.value);
    formConfigMessage.value = 'Configuration enregistrée.';
  } catch (err) {
    formConfigMessage.value = err instanceof Error ? err.message : 'Erreur inconnue';
  }
}

async function goReviewPage(page: number) {
  reviewPage.value = Math.min(Math.max(page, 1), reviewTotalPages.value);
  await loadReviews();
}

async function goQrCodePage(page: number) {
  qrCodePage.value = Math.min(Math.max(page, 1), qrCodeTotalPages.value);
  await loadQrCodes();
}

async function submitQrCode() {
  qrMessage.value = '';
  try {
    await createQrCode({
      whatsappNumber: buildInternationalPhone(qrForm.value.countryDialCode, qrForm.value.whatsappLocalNumber),
      label: qrForm.value.label || undefined
    });
    qrCodePage.value = 1;
    await loadQrCodes();
    qrForm.value = { countryDialCode: '+229', whatsappLocalNumber: '', label: '' };
    qrMessage.value = 'QR Code créé.';
  } catch (err) {
    qrMessage.value = err instanceof Error ? err.message : 'Erreur inconnue';
  }
}


async function copyText(value: string, message = 'Lien copié.') {
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
  showToast(message, 'success');
}

async function copyWidgetScript(qr: CompanyQrCode) {
  await copyText(getWidgetScript(qr), 'Script d integration copie.');
}

function getWidgetScript(qr: CompanyQrCode) {
  const origin = window.location.origin;
  return `<script src="${origin}/feedback-widget.js" data-feedback-url="${qr.feedbackUrl}" data-button-text="Feedback" defer></` + 'script>';
}

function onQrPhoneInput(event: Event) {
  qrForm.value.whatsappLocalNumber = digitsOnly((event.target as HTMLInputElement).value);
}

function downloadQrCode(qr: CompanyQrCode) {
  const link = document.createElement('a');
  link.href = qr.qrCodeDataUrl;
  link.download = `qr-code-${qr.slug}.png`;
  link.click();
}

async function submitPasswordChange() {
  passwordErrors.value = await validateForm(changePasswordSchema, passwordForm.value);
  if (Object.keys(passwordErrors.value).length) return;

  try {
    await changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    });
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    showToast('Mot de passe modifié avec succès.', 'success');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    if (message.toLowerCase().includes('actuel') || message.toLowerCase().includes('incorrect')) {
      passwordErrors.value.currentPassword = message;
      return;
    }
    if (message.toLowerCase().includes('nouveau')) {
      passwordErrors.value.newPassword = message;
      return;
    }
    showToast(message, 'error');
  }
}

function logout() {
  clearSession();
  window.location.href = '/login';
}

async function exportExcel() {
  const blob = await exportReviewsCsv();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'avis.xlsx';
  link.click();
  URL.revokeObjectURL(url);
}

watch(() => route.params.tab, (tab) => {
  if (typeof tab === 'string' && navItems.some((item) => item.key === tab)) {
    activeTab.value = tab as DashboardTab;
  }
});

watch([selectedYears, comparisonYear], loadCharts, { deep: true });

onMounted(() => {
  if (!route.params.tab) router.replace('/dashboard/dashboard');
  load();
});
</script>

<template>
  <main class="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[336px_1fr]">
    <UserSidebar :active-tab="activeTab" :company-name="stats?.company?.name || 'Entreprise'" :nav-items="navItems" @select="setTab($event as DashboardTab)" @logout="logout" />

    <section class="min-w-0 lg:col-start-2 lg:h-screen lg:overflow-y-auto">
      <UserPageHeader :title="pageTitle" @refresh="load" />

      <div class="m-4 rounded-3xl bg-white p-5 shadow-sm lg:m-6 lg:p-8">
        <p v-if="error" class="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{{ error }}</p>

        <section v-if="activeTab === 'dashboard'" class="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <article class="rounded-3xl bg-sky-50 p-7">
            <span class="grid h-14 w-14 place-items-center rounded-full bg-black text-white"><MessageSquareText :size="24" /></span>
            <p class="mt-4 text-lg font-bold text-black">Avis</p>
            <strong class="mt-2 block text-4xl font-black text-black">{{ stats?.count || 0 }}</strong>
          </article>
          <article class="rounded-3xl bg-emerald-50 p-7">
            <span class="grid h-14 w-14 place-items-center rounded-full bg-black text-white"><Star :size="24" /></span>
            <p class="mt-4 text-lg font-bold text-black">Note moyenne</p>
            <strong class="mt-2 block text-4xl font-black text-black">{{ stats?.averageRating || 0 }}/5</strong>
          </article>
          <article class="rounded-3xl bg-rose-50 p-7">
            <span class="grid h-14 w-14 place-items-center rounded-full bg-black text-white"><MessageSquareText :size="24" /></span>
            <p class="mt-4 text-lg font-bold text-black">Messages restants</p>
            <strong class="mt-2 block text-4xl font-black text-black">{{ stats?.remainingMessages || 0 }}</strong>
          </article>
        </section>

        <section v-if="activeTab === 'dashboard'" class="mb-8 grid gap-6 xl:grid-cols-2">
          <div class="rounded-3xl border border-slate-200 p-5">
            <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-xl font-black text-ink">Évolution mensuelle des avis</h2>
              <div class="flex flex-wrap items-center gap-2">
                <select v-model.number="selectedYears[0]" class="h-10 rounded-xl border border-slate-300 px-3 font-bold">
                  <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
                </select>
                <span class="text-sm font-bold text-slate-600">Comparer avec</span>
                <select v-model.number="comparisonYear" class="h-10 rounded-xl border border-slate-300 px-3 font-bold">
                  <option v-for="year in availableYears" :key="`compare-${year}`" :value="year">{{ year }}</option>
                </select>
              </div>
            </div>
            <svg viewBox="0 0 780 230" class="h-72 w-full overflow-visible">
              <g class="text-slate-300">
                <line x1="48" y1="190" x2="750" y2="190" stroke="currentColor" />
                <line x1="48" y1="40" x2="48" y2="190" stroke="currentColor" />
                <g v-for="tick in monthlyAxisTicks" :key="tick.value">
                  <line x1="44" :y1="tick.y" x2="750" :y2="tick.y" stroke="currentColor" stroke-dasharray="4 8" opacity="0.45" />
                  <text x="18" :y="tick.y + 4" class="fill-slate-500 text-xs font-bold">{{ tick.value }}</text>
                </g>
              </g>
              <polyline v-for="(serie, index) in monthlyEvolution" :key="serie.year" :points="linePoints(serie)" fill="none" :stroke="serieColor(index)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
              <g v-for="(serie, serieIndex) in monthlyEvolution" :key="`points-${serie.year}`">
                <g v-for="(month, index) in serie.months" :key="`${serie.year}-${month.month}`">
                  <circle :cx="monthlyX(index)" :cy="monthlyY(month.count)" r="5" :fill="serieColor(serieIndex)" />
                  <text v-if="month.count > 0" :x="monthlyX(index)" :y="monthlyY(month.count) - 12" text-anchor="middle" class="fill-ink text-xs font-black">{{ month.count }}</text>
                </g>
              </g>
              <text v-for="(label, index) in monthLabels" :key="label" :x="monthlyX(index) - 12" y="218" class="fill-slate-500 text-xs font-bold">{{ label }}</text>
            </svg>
            <div class="mt-2 flex gap-4 text-sm font-black">
              <span v-for="(serie, index) in monthlyEvolution" :key="serie.year" :class="index === 0 ? 'text-brand-700' : 'text-amber-600'">{{ serie.year }}</span>
            </div>
          </div>

          <div class="rounded-3xl border border-slate-200 p-5">
            <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-xl font-black text-ink">Avis par notation</h2>
              <div class="flex gap-2">
                <input v-model="ratingFilter.startDate" type="date" class="h-10 rounded-xl border border-slate-300 px-3 font-bold" @change="loadCharts" />
                <input v-model="ratingFilter.endDate" type="date" class="h-10 rounded-xl border border-slate-300 px-3 font-bold" @change="loadCharts" />
              </div>
            </div>
            <div class="grid gap-4">
              <div v-for="item in ratingDistribution" :key="item.rating" class="grid grid-cols-[70px_1fr_40px] items-center gap-3">
                <span class="font-black text-ink">{{ item.rating }} étoile{{ item.rating > 1 ? 's' : '' }}</span>
                <div class="h-5 rounded-full bg-slate-100">
                  <div class="h-5 rounded-full bg-brand-700" :style="{ width: `${(item.count / maxRatingCount) * 100}%` }"></div>
                </div>
                <span class="text-right font-black text-ink">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'reviews'">
          <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-2xl font-black text-ink">Avis clients</h2>
            <button class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-black text-white" @click="exportExcel">
              <Download :size="18" /> Export Excel
            </button>
          </div>

          <div class="overflow-x-auto rounded-3xl border border-slate-300">
            <table class="min-w-[760px] w-full border-collapse text-left">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-7 py-5 text-sm font-black text-black">Date</th>
                  <th class="px-7 py-5 text-sm font-black text-black">Note</th>
                  <th class="px-7 py-5 text-sm font-black text-black">Expérience</th>
                  <th class="px-7 py-5 text-sm font-black text-black">Statut</th>
                  <th class="px-7 py-5 text-sm font-black text-black">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="review in reviews" :key="review._id" class="border-t border-slate-200">
                  <td class="px-7 py-5 font-semibold text-slate-600">{{ new Date(review.createdAt).toLocaleDateString() }}</td>
                  <td class="px-7 py-5 font-black text-brand-700">{{ review.rating }}/5</td>
                  <td class="max-w-[420px] px-7 py-5 font-semibold text-slate-600"><span class="line-clamp-2">{{ review.serviceFeedback || '-' }}</span></td>
                  <td class="px-7 py-5"><span class="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">{{ review.notificationStatus }}</span></td>
                  <td class="px-7 py-5">
                    <button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-ink transition hover:bg-slate-100" title="Voir le detail" aria-label="Voir le detail" @click="selectedReview = review">
                      <Eye :size="17" />
                    </button>
                  </td>
                </tr>
                <tr v-if="!reviews.length">
                  <td colspan="5" class="px-7 py-12 text-center">
                    <strong class="block text-lg font-black text-ink">Aucun avis pour le moment.</strong>
                    <span class="mt-1 block font-semibold text-slate-500">Les retours clients apparaîtront ici dès qu’un QR Code sera utilisé.</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <BasePagination :pagination="reviewPagination" :page="reviewPage" label="avis au total" @page-change="goReviewPage" />
        </section>

        <section v-if="activeTab === 'qrcodes'" class="grid gap-6">
          <form class="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-[1.2fr_1fr_auto]" @submit.prevent="submitQrCode">
            <label>
              <span class="mb-2 block font-black text-ink">Numéro WhatsApp</span>
              <div class="grid grid-cols-[140px_1fr] gap-3">
                <CountryDialSelect v-model="qrForm.countryDialCode" />
                <input :value="qrForm.whatsappLocalNumber" required inputmode="numeric" pattern="[0-9]*" placeholder="0199997478" class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" @input="onQrPhoneInput" />
              </div>
            </label>
            <label>
              <span class="mb-2 block font-black text-ink">Libellé</span>
              <input v-model="qrForm.label" placeholder="Caisse, table 1, agence..." class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
            </label>
            <button class="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-black text-white"><Plus :size="18" /> Créer</button>
            <p v-if="qrMessage" class="md:col-span-3 rounded-xl px-4 py-3 text-sm font-bold" :class="qrMessage.includes('créé') || qrMessage.includes('copié') || qrMessage.includes('copie') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ qrMessage }}</p>
          </form>

          <div class="grid gap-4 xl:grid-cols-2">
            <article v-for="qr in qrCodes" :key="qr._id" class="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:grid-cols-[150px_1fr]">
              <div class="grid place-items-center rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <img :src="qr.qrCodeDataUrl" alt="QR Code" class="h-32 w-32 rounded-xl bg-white object-contain sm:h-36 sm:w-36" />
              </div>
              <div class="flex min-w-0 flex-col">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-start justify-between gap-2">
                    <h3 class="max-w-full truncate text-xl font-black text-ink">{{ qr.label || 'QR Code WhatsApp' }}</h3>
                    <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700">{{ qr.reviewCount }} avis</span>
                  </div>
                  <p class="mt-2 text-xs font-black uppercase tracking-wide text-slate-400">WhatsApp</p>
                  <p class="font-bold text-slate-700">{{ qr.whatsappNumber }}</p>
                  <a :href="qr.feedbackUrl" target="_blank" class="mt-3 block truncate rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50" :title="qr.feedbackUrl">{{ qr.feedbackUrl }}</a>
                </div>
                <div class="mt-4 grid grid-cols-3 gap-2 sm:mt-auto">
                  <button class="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-2 font-black text-ink transition hover:bg-slate-100" title="Copier le lien" aria-label="Copier le lien" @click="copyText(qr.feedbackUrl)"><Copy :size="16" /><span class="truncate">Lien</span></button>
                  <button class="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-2 font-black text-ink transition hover:bg-slate-100" title="Copier le script" aria-label="Copier le script" @click="copyWidgetScript(qr)"><Code2 :size="16" /><span class="truncate">Script</span></button>
                  <button class="inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-xl bg-brand-700 px-2 font-black text-white transition hover:bg-brand-600" title="Télécharger le QR Code" aria-label="Télécharger le QR Code" @click="downloadQrCode(qr)"><Download :size="16" /><span class="truncate">PNG</span></button>
                </div>
              </div>
            </article>
            <p v-if="!qrCodes.length" class="rounded-2xl bg-slate-50 p-6 font-bold text-slate-600">Aucun QR Code créé pour le moment.</p>
          </div>
          <BasePagination :pagination="qrCodePagination" :page="qrCodePage" label="QR Code au total" @page-change="goQrCodePage" />
        </section>

        <section v-if="activeTab === 'ai'" class="grid place-items-center rounded-3xl bg-slate-50 p-16 text-center">
          <LineChart :size="52" class="text-brand-700" />
          <h2 class="mt-5 text-3xl font-black text-ink">Analyse IA</h2>
          <span class="mt-3 rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700">Bientôt</span>
          <p class="mt-4 max-w-xl font-semibold text-slate-500">Synthèse intelligente des avis, détection des irritants et recommandations automatiques.</p>
        </section>

        <WhatsAppSettingsPanel v-if="activeTab === 'whatsapp'" />

        <InboxPanel v-if="activeTab === 'inbox'" />

        <AutomationPanel v-if="activeTab === 'automations'" />

        <section v-if="activeTab === 'settings'" class="grid gap-6">
          <div class="inline-flex w-fit rounded-2xl border border-slate-300 bg-white p-1">
            <button
              class="h-11 rounded-xl px-4 text-sm font-black transition"
              :class="settingsTab === 'feedback-form' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'"
              @click="settingsTab = 'feedback-form'"
            >
              Formulaire de feedback
            </button>
            <button
              class="h-11 rounded-xl px-4 text-sm font-black transition"
              :class="settingsTab === 'password' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'"
              @click="settingsTab = 'password'"
            >
              Mot de passe
            </button>
          </div>

          <FeedbackFormSettings v-if="settingsTab === 'feedback-form'" :model-value="formConfig" :message="formConfigMessage" @save="saveFormConfig" />

          <div v-if="settingsTab === 'password'" class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div class="mb-6 flex items-center gap-3">
              <span class="grid h-12 w-12 place-items-center rounded-full bg-brand-700 text-white"><Lock :size="22" /></span>
              <div>
                <h2 class="text-2xl font-black text-ink">Changer le mot de passe</h2>
                <p class="mt-1 font-semibold text-slate-500">Renseignez l’ancien mot de passe puis confirmez le nouveau.</p>
              </div>
            </div>

            <form class="grid max-w-2xl gap-5" @submit.prevent="submitPasswordChange">
              <label class="block">
                <span class="mb-2 block font-black text-ink">Ancien mot de passe</span>
                <PasswordField v-model="passwordForm.currentPassword" input-class="h-13" />
                <span v-if="passwordErrors.currentPassword" class="mt-2 block text-sm font-bold text-red-600">{{ passwordErrors.currentPassword }}</span>
              </label>
              <label class="block">
                <span class="mb-2 block font-black text-ink">Nouveau mot de passe</span>
                <PasswordField v-model="passwordForm.newPassword" placeholder="Nouveau mot de passe" input-class="h-13" />
                <span v-if="passwordErrors.newPassword" class="mt-2 block text-sm font-bold text-red-600">{{ passwordErrors.newPassword }}</span>
              </label>
              <label class="block">
                <span class="mb-2 block font-black text-ink">Confirmation</span>
                <PasswordField v-model="passwordForm.confirmPassword" placeholder="Confirmation" input-class="h-13" />
                <span v-if="passwordErrors.confirmPassword" class="mt-2 block text-sm font-bold text-red-600">{{ passwordErrors.confirmPassword }}</span>
              </label>
              <button class="h-13 rounded-xl bg-brand-700 px-5 font-black text-white">Mettre à jour</button>
            </form>
          </div>
        </section>
      </div>
    </section>

    <ToastHost />

    <div v-if="selectedReview" class="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" @click.self="selectedReview = null">
      <div class="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-black text-ink">Detail de l'avis</h2>
            <p class="mt-1 text-sm font-bold text-slate-500">{{ new Date(selectedReview.createdAt).toLocaleString('fr-FR') }}</p>
          </div>
          <button class="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-ink" aria-label="Fermer" @click="selectedReview = null">
            <X :size="18" />
          </button>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-black uppercase text-slate-500">Note</p>
            <strong class="mt-1 block text-brand-700">{{ selectedReview.rating }}/5</strong>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-black uppercase text-slate-500">Statut notification</p>
            <strong class="mt-1 block text-ink">{{ selectedReview.notificationStatus }}</strong>
          </div>
        </div>

        <div class="mt-4 grid gap-4">
          <div class="rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-black uppercase text-slate-500">QR Code</p>
            <p class="mt-2 font-semibold text-ink">{{ selectedReview.qrCode?.label || 'QR Code' }} - {{ selectedReview.qrCode?.whatsappNumber || selectedReview.notificationWhatsappNumber || '-' }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-black uppercase text-slate-500">Parlez-nous de votre expérience ?</p>
            <p class="mt-2 whitespace-pre-line font-semibold text-ink">{{ selectedReview.serviceFeedback || '-' }}</p>
          </div>
          <div v-for="answer in selectedReview.customAnswers || []" :key="answer.questionId" class="rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-black uppercase text-slate-500">{{ answer.label }}</p>
            <p class="mt-2 whitespace-pre-line font-semibold text-ink">{{ answer.value || '-' }}</p>
          </div>
          <div v-if="selectedReview.notificationError" class="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p class="text-xs font-black uppercase text-red-600">Erreur notification</p>
            <p class="mt-2 font-semibold text-red-700">{{ selectedReview.notificationError }}</p>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
