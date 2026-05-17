<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Bot,
  ChevronDown,
  Copy,
  Download,
  Eye,
  Home,
  KeyRound,
  LineChart,
  Lock,
  LogOut,
  MessageSquareText,
  Plus,
  QrCode,
  RefreshCcw,
  Settings,
  Star,
  X
} from 'lucide-vue-next';
import { useAuth } from '../composables/useAuth';
import {
  useDashboard,
  type CompanyQrCode,
  type DashboardStats,
  type MonthlyEvolution,
  type PaginationMeta,
  type RatingDistribution,
  type Review
} from '../composables/useDashboard';
import CountryDialSelect from '../components/CountryDialSelect.vue';
import { buildInternationalPhone, digitsOnly } from '../constants/countries';
import { changePasswordSchema, validateForm, type FormErrors } from '../validators/auth.validator';
import PasswordField from '../components/PasswordField.vue';

type DashboardTab = 'dashboard' | 'reviews' | 'qrcodes' | 'ai' | 'settings';
type ChangePasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string };

const router = useRouter();
const route = useRoute();
const { logout: clearSession, changePassword } = useAuth();
const {
  getStats,
  getReviews,
  getQrCodes,
  getMonthlyEvolution,
  getRatingDistribution,
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
const settingsToast = ref('');
const error = ref('');
const qrMessage = ref('');

const navItems: Array<{ key: DashboardTab; label: string; icon: typeof Home; badge?: string }> = [
  { key: 'dashboard', label: 'Tableau de bord', icon: Home },
  { key: 'reviews', label: 'Avis clients', icon: MessageSquareText },
  { key: 'qrcodes', label: 'QR Code', icon: QrCode },
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

function getPageNumbers(totalPages: number, currentPage: number) {
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
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
    const [statsResult, reviewsResult, qrCodesResult] = await Promise.all([getStats(), getReviews(reviewPage.value, pageSize), getQrCodes(qrCodePage.value, pageSize)]);
    stats.value = statsResult;
    reviews.value = reviewsResult.reviews;
    reviewPagination.value = reviewsResult.pagination;
    qrCodes.value = qrCodesResult.qrCodes;
    qrCodePagination.value = qrCodesResult.pagination;
    await loadCharts();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur inconnue';
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

async function copyText(value: string) {
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
  qrMessage.value = 'Lien copié.';
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
  settingsToast.value = '';
  passwordErrors.value = await validateForm(changePasswordSchema, passwordForm.value);
  if (Object.keys(passwordErrors.value).length) return;

  try {
    await changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    });
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    settingsToast.value = 'Mot de passe modifié avec succès.';
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
    settingsToast.value = message;
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
    <aside class="hidden border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[336px] lg:flex-col lg:overflow-hidden">
      <div class="px-5 py-5">
        <RouterLink to="/" class="flex items-center gap-3 text-2xl font-black text-ink">
          <span class="grid h-11 w-11 place-items-center rounded-full bg-brand-700 text-white"><QrCode :size="23" /></span>
          QR Feedback
          <span class="rounded-full border border-slate-300 px-2 py-0.5 text-xs font-bold text-slate-500">Beta</span>
        </RouterLink>
      </div>
      <div class="mx-5 border-t border-slate-200 pt-7">
        <button class="flex h-16 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 font-black text-ink">
          <span class="flex items-center gap-3">
            <span class="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><KeyRound :size="20" /></span>
            {{ stats?.company?.name || 'Entreprise' }}
          </span>
          <ChevronDown :size="20" />
        </button>
      </div>
      <nav class="mt-5 flex-1 space-y-2 overflow-y-auto px-5 pb-4">
        <button
          v-for="item in navItems"
          :key="item.key"
          class="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-base font-bold transition"
          :class="activeTab === item.key ? 'bg-brand-100 text-brand-700' : 'text-slate-700 hover:bg-slate-100'"
          @click="setTab(item.key)"
        >
          <component :is="item.icon" :size="22" />
          <span class="flex-1">{{ item.label }}</span>
          <span v-if="item.badge" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700">{{ item.badge }}</span>
        </button>
      </nav>
      <button class="mt-auto flex h-14 shrink-0 items-center gap-3 border-t border-slate-200 px-6 font-bold text-slate-700" @click="logout">
        <LogOut :size="20" /> Déconnexion
      </button>
    </aside>

    <section class="min-w-0 lg:col-start-2 lg:h-screen lg:overflow-y-auto">
      <header class="m-4 flex items-center justify-between rounded-3xl bg-white px-5 py-5 shadow-sm lg:m-6 lg:px-8">
        <div>
          <p class="text-sm font-black uppercase tracking-wide text-brand-700">Entreprise</p>
          <h1 class="mt-1 text-3xl font-black text-black">{{ pageTitle }}</h1>
        </div>
        <div class="flex items-center gap-3">
          <RouterLink to="/paiement" class="hidden rounded-full border border-brand-700 px-5 py-3 text-sm font-black text-brand-700 sm:inline-flex">Acheter des messages</RouterLink>
          <button class="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-700" @click="load"><RefreshCcw :size="20" /></button>
        </div>
      </header>

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
            <table class="min-w-[920px] w-full border-collapse text-left">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-7 py-5 text-sm font-black text-black">Date</th>
                  <th class="px-7 py-5 text-sm font-black text-black">Client</th>
                  <th class="px-7 py-5 text-sm font-black text-black">Note</th>
                  <th class="px-7 py-5 text-sm font-black text-black">Services</th>
                  <th class="px-7 py-5 text-sm font-black text-black">À améliorer</th>
                  <th class="px-7 py-5 text-sm font-black text-black">Statut</th>
                  <th class="px-7 py-5 text-sm font-black text-black">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="review in reviews" :key="review._id" class="border-t border-slate-200">
                  <td class="px-7 py-5 font-semibold text-slate-600">{{ new Date(review.createdAt).toLocaleDateString() }}</td>
                  <td class="px-7 py-5 font-black text-ink">{{ review.customerName || '-' }}</td>
                  <td class="px-7 py-5 font-black text-brand-700">{{ review.rating }}/5</td>
                  <td class="px-7 py-5 font-semibold text-slate-600">{{ review.serviceFeedback || '-' }}</td>
                  <td class="px-7 py-5 font-semibold text-slate-600">{{ review.improvementSuggestion || '-' }}</td>
                  <td class="px-7 py-5"><span class="rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">{{ review.notificationStatus }}</span></td>
                  <td class="px-7 py-5">
                    <button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-ink transition hover:bg-slate-100" title="Voir le detail" aria-label="Voir le detail" @click="selectedReview = review">
                      <Eye :size="17" />
                    </button>
                  </td>
                </tr>
                <tr v-if="!reviews.length">
                  <td colspan="7" class="px-7 py-10 text-center font-bold text-slate-500">Aucun avis pour le moment.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span class="text-sm font-bold text-slate-500">{{ reviewPagination.total }} avis au total</span>
            <div class="flex flex-wrap gap-2">
              <button class="h-10 rounded-xl border border-slate-300 px-4 font-black text-ink disabled:opacity-40" :disabled="reviewPage <= 1" @click="goReviewPage(reviewPage - 1)">Precedent</button>
              <button v-for="page in getPageNumbers(reviewTotalPages, reviewPage)" :key="`review-${page}`" class="h-10 min-w-10 rounded-xl border px-3 font-black" :class="page === reviewPage ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 text-ink'" @click="goReviewPage(page)">{{ page }}</button>
              <button class="h-10 rounded-xl border border-slate-300 px-4 font-black text-ink disabled:opacity-40" :disabled="reviewPage >= reviewTotalPages" @click="goReviewPage(reviewPage + 1)">Suivant</button>
            </div>
          </div>
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
            <p v-if="qrMessage" class="md:col-span-3 rounded-xl px-4 py-3 text-sm font-bold" :class="qrMessage.includes('créé') || qrMessage.includes('copié') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ qrMessage }}</p>
          </form>

          <div class="grid gap-4 xl:grid-cols-2">
            <article v-for="qr in qrCodes" :key="qr._id" class="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[180px_1fr]">
              <img :src="qr.qrCodeDataUrl" alt="QR Code" class="h-44 w-44 rounded-2xl border border-slate-200 bg-white p-2" />
              <div class="min-w-0">
                <h3 class="text-xl font-black text-ink">{{ qr.label || 'QR Code WhatsApp' }}</h3>
                <p class="mt-2 font-bold text-slate-600">WhatsApp: {{ qr.whatsappNumber }}</p>
                <a :href="qr.feedbackUrl" target="_blank" class="mt-3 block break-all font-bold text-brand-700">{{ qr.feedbackUrl }}</a>
                <button class="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-4 font-black text-ink" @click="copyText(qr.feedbackUrl)"><Copy :size="16" /> Copier le lien</button>
                <button class="mt-4 ml-2 inline-flex h-10 items-center gap-2 rounded-xl bg-brand-700 px-4 font-black text-white" @click="downloadQrCode(qr)"><Download :size="16" /> Télécharger</button>
              </div>
            </article>
            <p v-if="!qrCodes.length" class="rounded-2xl bg-slate-50 p-6 font-bold text-slate-600">Aucun QR Code créé pour le moment.</p>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span class="text-sm font-bold text-slate-500">{{ qrCodePagination.total }} QR Code au total</span>
            <div class="flex flex-wrap gap-2">
              <button class="h-10 rounded-xl border border-slate-300 px-4 font-black text-ink disabled:opacity-40" :disabled="qrCodePage <= 1" @click="goQrCodePage(qrCodePage - 1)">Precedent</button>
              <button v-for="page in getPageNumbers(qrCodeTotalPages, qrCodePage)" :key="`qrcode-${page}`" class="h-10 min-w-10 rounded-xl border px-3 font-black" :class="page === qrCodePage ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 text-ink'" @click="goQrCodePage(page)">{{ page }}</button>
              <button class="h-10 rounded-xl border border-slate-300 px-4 font-black text-ink disabled:opacity-40" :disabled="qrCodePage >= qrCodeTotalPages" @click="goQrCodePage(qrCodePage + 1)">Suivant</button>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'ai'" class="grid place-items-center rounded-3xl bg-slate-50 p-16 text-center">
          <LineChart :size="52" class="text-brand-700" />
          <h2 class="mt-5 text-3xl font-black text-ink">Analyse IA</h2>
          <span class="mt-3 rounded-full bg-amber-100 px-4 py-2 text-sm font-black text-amber-700">Bientôt</span>
          <p class="mt-4 max-w-xl font-semibold text-slate-500">Synthèse intelligente des avis, détection des irritants et recommandations automatiques.</p>
        </section>

        <section v-if="activeTab === 'settings'" class="grid gap-6">
          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
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
          <div v-if="settingsToast" class="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl px-5 py-4 text-sm font-black shadow-xl" :class="settingsToast.includes('succès') ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'">{{ settingsToast }}</div>
        </section>
      </div>
    </section>

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
            <p class="text-xs font-black uppercase text-slate-500">Client</p>
            <strong class="mt-1 block text-ink">{{ selectedReview.customerName || '-' }}</strong>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-black uppercase text-slate-500">Telephone</p>
            <strong class="mt-1 block text-ink">{{ selectedReview.customerPhone || '-' }}</strong>
          </div>
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
            <p class="text-xs font-black uppercase text-slate-500">Services</p>
            <p class="mt-2 whitespace-pre-line font-semibold text-ink">{{ selectedReview.serviceFeedback || '-' }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-black uppercase text-slate-500">A ameliorer</p>
            <p class="mt-2 whitespace-pre-line font-semibold text-ink">{{ selectedReview.improvementSuggestion || '-' }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-black uppercase text-slate-500">Mauvaise experience</p>
            <p class="mt-2 whitespace-pre-line font-semibold text-ink">{{ selectedReview.badExperience || '-' }}</p>
          </div>
          <div class="rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-black uppercase text-slate-500">QR Code</p>
            <p class="mt-2 font-semibold text-ink">{{ selectedReview.qrCode?.label || 'QR Code' }} - {{ selectedReview.qrCode?.whatsappNumber || selectedReview.notificationWhatsappNumber || '-' }}</p>
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
