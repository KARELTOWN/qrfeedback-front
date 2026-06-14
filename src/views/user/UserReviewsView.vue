<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ChevronLeft, Download, Eye, Mail, Phone, Plus, User, X } from 'lucide-vue-next';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import BasePagination from '../../components/shared/BasePagination.vue';
import { useDashboard, type FeedbackFormConfig, type PaginationMeta, type Review } from '../../composables/useDashboard';

type ReviewColumnKind = 'base' | 'custom';
type ReviewColumn = { key: string; label: string; kind: ReviewColumnKind; type?: string; questionId?: string };
type ContactSelection = { type: 'email' | 'phone' | 'fullName'; value: string; label: string };
type ReviewSearchFilters = { query: string; rating: number | ''; sentiment: 'positive' | 'neutral' | 'negative' | ''; dateRange: string[] | null };

const { getReviews, getFeedbackFormConfig, exportReviewsCsv } = useDashboard();
const emptyPagination: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
const reviews = ref<Review[]>([]);
const reviewPagination = ref<PaginationMeta>(emptyPagination);
const reviewPage = ref(1);
const pageSize = 10;
const selectedReview = ref<Review | null>(null);
const selectedContact = ref<ContactSelection | null>(null);
const contactReviews = ref<Review[]>([]);
const contactPagination = ref<PaginationMeta>(emptyPagination);
const contactReviewPage = ref(1);
const contactPageSize = 9;
const reviewFilters = ref<ReviewSearchFilters>({ query: '', rating: '', sentiment: '', dateRange: null });
const reviewSearchEngine = ref('');
const showColumnMenu = ref(false);
const formConfig = ref<FeedbackFormConfig | null>(null);
const visibleReviewColumnKeys = ref<string[]>(['createdAt', 'rating', 'serviceFeedback']);
let reviewSearchDebounce: ReturnType<typeof setTimeout> | undefined;

const reviewTotalPages = computed(() => reviewPagination.value.totalPages);
const contactReviewTotalPages = computed(() => contactPagination.value.totalPages);
const reviewColumns = computed<ReviewColumn[]>(() => {
  const baseColumns: ReviewColumn[] = [
    { key: 'createdAt', label: 'Date', kind: 'base' },
    { key: 'rating', label: 'Note', kind: 'base' },
    { key: 'serviceFeedback', label: 'Expérience', kind: 'base' }
  ];
  const customColumns = (formConfig.value?.customQuestions || []).map((question) => ({ key: `custom:${question.id}`, label: question.label, kind: 'custom' as const, type: question.type, questionId: question.id }));
  return [...baseColumns, ...customColumns];
});
const visibleReviewColumns = computed(() => reviewColumns.value.filter((column) => visibleReviewColumnKeys.value.includes(column.key)));
const contactTitle = computed(() => selectedContact.value ? `${selectedContact.value.label}: ${selectedContact.value.value}` : '');

function formatFilterDate(value?: string) {
  return value || undefined;
}

function formatDatePickerRange(value: Array<string | Date> | string | Date) {
  const format = (date: string | Date) => {
    if (date instanceof Date) {
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
    }
    const [year, month, day] = date.split('-');
    return year && month && day ? `${day}/${month}/${year}` : date;
  };
  return Array.isArray(value) ? value.filter(Boolean).map(format).join(' - ') : format(value);
}

function activeReviewFilters() {
  const range = reviewFilters.value.dateRange || [];
  return { query: reviewFilters.value.query, rating: reviewFilters.value.rating, sentiment: reviewFilters.value.sentiment, startDate: formatFilterDate(range[0]), endDate: formatFilterDate(range[1]) };
}

function reviewAnswer(review: Review, questionId?: string) { return review.customAnswers?.find((answer) => answer.questionId === questionId); }
function reviewCellValue(review: Review, column: ReviewColumn) {
  if (column.key === 'createdAt') return new Date(review.createdAt).toLocaleDateString('fr-FR');
  if (column.key === 'rating') return `${review.rating}/5`;
  if (column.key === 'serviceFeedback') return review.serviceFeedback || '-';
  return reviewAnswer(review, column.questionId)?.value || '-';
}
function isContactColumn(column: ReviewColumn) { return column.kind === 'custom' && (column.type === 'email' || column.type === 'phone' || column.type === 'fullName'); }
function contactIcon(type: string | undefined) { if (type === 'fullName') return User; return type === 'email' ? Mail : Phone; }
function toggleReviewColumn(key: string) {
  if (visibleReviewColumnKeys.value.includes(key)) {
    if (visibleReviewColumnKeys.value.length === 1) return;
    visibleReviewColumnKeys.value = visibleReviewColumnKeys.value.filter((item) => item !== key);
    return;
  }
  visibleReviewColumnKeys.value = [...visibleReviewColumnKeys.value, key];
}
function syncDefaultReviewColumns() {
  const preferredCustomKeys = reviewColumns.value.filter((column) => {
    const label = column.label.toLowerCase();
    return column.kind === 'custom' && (['email', 'phone', 'fullName'].includes(column.type || '') || label.includes('nom') || label.includes('prenom'));
  }).map((column) => column.key);
  visibleReviewColumnKeys.value = Array.from(new Set([...visibleReviewColumnKeys.value, ...preferredCustomKeys]));
}
function statusClass(status?: string) {
  if (status === 'sent' || status === 'delivered') return 'bg-emerald-50 text-emerald-700';
  if (status === 'failed') return 'bg-red-50 text-red-700';
  if (status === 'skipped') return 'bg-slate-100 text-slate-600';
  return 'bg-amber-50 text-amber-700';
}
async function loadReviews() {
  const result = await getReviews(reviewPage.value, pageSize, activeReviewFilters());
  reviews.value = result.reviews;
  reviewPagination.value = result.pagination;
  reviewSearchEngine.value = result.engine || '';
}
async function applyReviewFilters() { reviewPage.value = 1; await loadReviews(); }
async function loadContactReviews() {
  if (!selectedContact.value) return;
  const result = await getReviews(contactReviewPage.value, contactPageSize, { contactType: selectedContact.value.type, contactValue: selectedContact.value.value });
  contactReviews.value = result.reviews;
  contactPagination.value = result.pagination;
}
async function openContactReviews(column: ReviewColumn, value: string | number) {
  if (!isContactColumn(column) || !value) return;
  selectedContact.value = { type: column.type as 'email' | 'phone' | 'fullName', value: String(value), label: column.label };
  contactReviewPage.value = 1;
  await loadContactReviews();
}
function closeContactReviews() { selectedContact.value = null; contactReviews.value = []; contactPagination.value = emptyPagination; }
async function goReviewPage(page: number) { reviewPage.value = Math.min(Math.max(page, 1), reviewTotalPages.value); await loadReviews(); }
async function goContactReviewPage(page: number) { contactReviewPage.value = Math.min(Math.max(page, 1), contactReviewTotalPages.value); await loadContactReviews(); }
async function exportExcel() { const blob = await exportReviewsCsv(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'avis.xlsx'; link.click(); URL.revokeObjectURL(url); }
async function load() { const [config] = await Promise.all([getFeedbackFormConfig(), loadReviews()]); formConfig.value = config; syncDefaultReviewColumns(); }

watch(() => reviewFilters.value.query, () => {
  if (reviewSearchDebounce) clearTimeout(reviewSearchDebounce);
  reviewSearchDebounce = setTimeout(() => {
    applyReviewFilters();
  }, 450);
});

watch(
  [() => reviewFilters.value.rating, () => reviewFilters.value.sentiment, () => reviewFilters.value.dateRange],
  () => {
    applyReviewFilters();
  },
  { deep: true }
);

onMounted(load);

onBeforeUnmount(() => {
  if (reviewSearchDebounce) clearTimeout(reviewSearchDebounce);
});
</script>

<template>
  <section>
    <div v-if="!selectedContact">
      <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 class="text-2xl font-black text-ink">Avis clients</h2><p class="mt-1 font-semibold text-slate-500">Choisissez les champs visibles et ouvrez une fiche contact depuis un email ou un téléphone.</p></div>
        <div class="flex flex-wrap items-center gap-2"><div class="relative"><button class="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-black text-ink transition hover:bg-slate-50" @click="showColumnMenu = !showColumnMenu"><Plus :size="18" /> Champs</button><div v-if="showColumnMenu" class="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl"><p class="px-2 pb-2 text-xs font-black uppercase text-slate-400">Colonnes visibles</p><button v-for="column in reviewColumns" :key="column.key" class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left font-bold text-ink transition hover:bg-slate-50" @click="toggleReviewColumn(column.key)"><span class="truncate">{{ column.label }}</span><span class="grid h-5 w-5 place-items-center rounded-md border text-xs" :class="visibleReviewColumnKeys.includes(column.key) ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 text-transparent'">?</span></button></div></div><button class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-black text-white" @click="exportExcel"><Download :size="18" /> Export Excel</button></div>
      </div>

      <div class="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.35fr)_150px_180px_minmax(340px,1.25fr)]">
        <label class="grid gap-1">
          <span class="px-1 text-xs font-black uppercase text-slate-500">Recherche</span>
          <input v-model="reviewFilters.query" placeholder="Rechercher dans les avis" class="h-11 min-w-0 rounded-xl border border-slate-300 px-3 font-bold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
        </label>
        <label class="grid gap-1">
          <span class="px-1 text-xs font-black uppercase text-slate-500">Note</span>
          <select v-model="reviewFilters.rating" class="h-11 rounded-xl border border-slate-300 bg-white px-3 font-bold outline-none focus:border-brand-700"><option value="">Choisir</option><option v-for="rating in [1, 2, 3, 4, 5]" :key="rating" :value="rating">{{ rating }}/5</option></select>
        </label>
        <label class="grid gap-1">
          <span class="px-1 text-xs font-black uppercase text-slate-500">Sentiment</span>
          <select v-model="reviewFilters.sentiment" class="h-11 rounded-xl border border-slate-300 bg-white px-3 font-bold outline-none focus:border-brand-700"><option value="">Choisir</option><option value="positive">Positif</option><option value="neutral">Neutre</option><option value="negative">Négatif</option></select>
        </label>
        <label class="grid min-w-0 gap-1 md:col-span-2 xl:col-span-1">
          <span class="px-1 text-xs font-black uppercase text-slate-500">Période</span>
          <VueDatePicker v-model="reviewFilters.dateRange" range multi-calendars model-type="yyyy-MM-dd" :formats="{ input: 'dd/MM/yyyy', preview: 'dd/MM/yyyy' }" placeholder="Sélectionner une période" :enable-time-picker="false" auto-apply />
        </label>
        <p v-if="reviewSearchEngine" class="md:col-span-2 xl:col-span-4 rounded-xl bg-brand-50 px-3 py-2 text-sm font-black text-brand-700">Recherche servie par Typesense</p>
      </div>

      <div class="overflow-x-auto rounded-3xl border border-slate-300 bg-white"><table class="w-full min-w-[920px] border-collapse text-left"><thead class="bg-slate-50"><tr><th v-for="column in visibleReviewColumns" :key="column.key" class="px-7 py-5 text-sm font-black text-black">{{ column.label }}</th><th class="w-28 px-7 py-5 text-sm font-black text-black">Action</th></tr></thead><tbody><tr v-for="review in reviews" :key="review._id" class="border-t border-slate-200"><td v-for="column in visibleReviewColumns" :key="`${review._id}-${column.key}`" class="max-w-[320px] px-7 py-5 font-semibold text-slate-600"><button v-if="isContactColumn(column) && reviewAnswer(review, column.questionId)?.value" class="inline-flex max-w-full items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 font-black text-brand-700 transition hover:bg-brand-50" @click="openContactReviews(column, reviewAnswer(review, column.questionId)?.value || '')"><component :is="contactIcon(column.type)" :size="15" /><span class="truncate">{{ reviewCellValue(review, column) }}</span></button><span v-else-if="column.key === 'rating'" class="font-black text-brand-700">{{ reviewCellValue(review, column) }}</span><span v-else class="line-clamp-2">{{ reviewCellValue(review, column) }}</span></td><td class="px-7 py-5"><button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-ink transition hover:bg-slate-100" title="Voir le détail" aria-label="Voir le détail" @click="selectedReview = review"><Eye :size="17" /></button></td></tr><tr v-if="!reviews.length"><td :colspan="visibleReviewColumns.length + 1" class="px-7 py-12 text-center"><strong class="block text-lg font-black text-ink">Aucun avis pour le moment.</strong><span class="mt-1 block font-semibold text-slate-500">Les retours clients apparaîtront ici dès qu'un QR Code sera utilisé.</span></td></tr></tbody></table></div>
      <BasePagination :pagination="reviewPagination" :page="reviewPage" label="avis au total" @page-change="goReviewPage" />
    </div>

    <div v-else>
      <div class="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><button class="mb-3 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 font-black text-ink transition hover:bg-slate-50" @click="closeContactReviews"><ChevronLeft :size="17" /> Retour aux avis</button><h2 class="text-2xl font-black text-ink">Historique du contact</h2><p class="mt-1 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 font-black text-brand-700"><component :is="selectedContact.type === 'email' ? Mail : Phone" :size="16" />{{ contactTitle }}</p></div><span class="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">{{ contactPagination.total }} avis</span></div>
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><article v-for="review in contactReviews" :key="review._id" class="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-black text-slate-500">{{ new Date(review.createdAt).toLocaleDateString('fr-FR') }}</p><strong class="mt-1 block text-2xl font-black text-brand-700">{{ review.rating }}/5</strong></div></div><p class="mt-4 line-clamp-4 flex-1 font-semibold text-slate-700">{{ review.serviceFeedback || 'Aucun commentaire principal.' }}</p><div class="mt-4 grid gap-2"><p v-for="answer in (review.customAnswers || []).slice(0, 3)" :key="answer.questionId" class="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600"><span class="font-black text-ink">{{ answer.label }}:</span> {{ answer.value || '-' }}</p></div><button class="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 font-black text-ink transition hover:bg-slate-50" @click="selectedReview = review"><Eye :size="16" /> Voir le détail</button></article><div v-if="!contactReviews.length" class="rounded-2xl bg-slate-50 p-6 font-bold text-slate-600">Aucun avis trouvé pour ce contact.</div></div>
      <BasePagination :pagination="contactPagination" :page="contactReviewPage" label="avis pour ce contact" @page-change="goContactReviewPage" />
    </div>

    <div v-if="selectedReview" class="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" @click.self="selectedReview = null"><div class="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><div class="mb-5 flex items-start justify-between gap-4"><div><h2 class="text-2xl font-black text-ink">Détail de l'avis</h2><p class="mt-1 text-sm font-bold text-slate-500">{{ new Date(selectedReview.createdAt).toLocaleString('fr-FR') }}</p></div><button class="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-ink" aria-label="Fermer" @click="selectedReview = null"><X :size="18" /></button></div>
      <div class="grid gap-4 sm:grid-cols-2"><div class="rounded-2xl bg-slate-50 p-4"><p class="text-xs font-black uppercase text-slate-500">Note</p><strong class="mt-1 block text-brand-700">{{ selectedReview.rating }}/5</strong></div><div class="rounded-2xl bg-slate-50 p-4"><p class="text-xs font-black uppercase text-slate-500">QR Code</p><strong class="mt-1 block text-ink">{{ selectedReview.qrCode?.label || 'QR Code' }}</strong></div></div>
      <div class="mt-4 grid gap-3 sm:grid-cols-2"><div class="rounded-2xl border border-slate-200 p-4"><div class="flex flex-wrap items-center justify-between gap-2"><p class="text-xs font-black uppercase text-slate-500">Notification email</p><span class="inline-flex shrink-0 rounded-full px-3 py-1 text-sm font-black" :class="statusClass(selectedReview.emailNotificationStatus)">{{ selectedReview.emailNotificationStatus || '-' }}</span></div><p class="mt-3 break-words text-sm font-semibold text-slate-600">{{ selectedReview.notificationEmail || '-' }}</p><p v-if="selectedReview.emailNotificationError" class="mt-2 break-words text-sm font-bold text-red-700">{{ selectedReview.emailNotificationError }}</p></div></div>
      <div class="mt-4 grid gap-4"><div class="rounded-2xl border border-slate-200 p-4"><p class="text-xs font-black uppercase text-slate-500">Parlez-nous de votre expérience ?</p><p class="mt-2 whitespace-pre-line font-semibold text-ink">{{ selectedReview.serviceFeedback || '-' }}</p></div><div v-for="answer in selectedReview.customAnswers || []" :key="answer.questionId" class="rounded-2xl border border-slate-200 p-4"><p class="text-xs font-black uppercase text-slate-500">{{ answer.label }}</p><p class="mt-2 whitespace-pre-line font-semibold text-ink">{{ answer.value || '-' }}</p></div></div>
    </div></div>
  </section>
</template>
