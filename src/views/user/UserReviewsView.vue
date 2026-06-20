<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Archive, CalendarDays, ChevronLeft, Download, Eye, Mail, MessageSquareText, Phone, Search, Star, Tag, User, X } from 'lucide-vue-next';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import BasePagination from '../../components/shared/BasePagination.vue';
import { useDashboard, type CompanyQrCode, type PaginationMeta, type Review } from '../../composables/useDashboard';

type ContactSelection = { type: 'email' | 'phone' | 'fullName'; value: string; label: string };
type ReviewSearchFilters = {
  query: string;
  rating: number | '';
  sentiment: 'positive' | 'neutral' | 'negative' | '';
  qrCodeId: string;
  moderationStatus: string;
  channel: 'email' | 'telegram' | '';
  dateRange: string[] | null;
};

const { getReviews, getQrCodes, updateReviewModeration, exportReviewsCsv } = useDashboard();
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
const reviewFilters = ref<ReviewSearchFilters>({ query: '', rating: '', sentiment: '', qrCodeId: '', moderationStatus: '', channel: '', dateRange: null });
const reviewSearchEngine = ref('');
const qrCodes = ref<CompanyQrCode[]>([]);
const moderationDraft = ref({ moderationStatus: 'published' as Review['moderationStatus'], tags: '', internalNote: '' });
let reviewSearchDebounce: ReturnType<typeof setTimeout> | undefined;

const reviewTotalPages = computed(() => reviewPagination.value.totalPages);
const contactReviewTotalPages = computed(() => contactPagination.value.totalPages);
const contactTitle = computed(() => selectedContact.value ? `${selectedContact.value.label}: ${selectedContact.value.value}` : '');
const selectedQrLabel = computed(() => {
  if (!reviewFilters.value.qrCodeId) return 'Tous les QR codes';
  const qr = qrCodes.value.find((item) => item._id === reviewFilters.value.qrCodeId);
  return qr?.label || qr?.slug || 'QR code sélectionné';
});
const currentReviewsAverage = computed(() => {
  if (!reviews.value.length) return 0;
  return Number((reviews.value.reduce((sum, review) => sum + review.rating, 0) / reviews.value.length).toFixed(2));
});
const archivedOnPage = computed(() => reviews.value.filter((review) => review.moderationStatus === 'archived').length);

function formatFilterDate(value?: string) {
  return value || undefined;
}

function activeReviewFilters() {
  const range = reviewFilters.value.dateRange || [];
  return {
    query: reviewFilters.value.query,
    rating: reviewFilters.value.rating,
    sentiment: reviewFilters.value.sentiment,
    qrCodeId: reviewFilters.value.qrCodeId,
    moderationStatus: reviewFilters.value.moderationStatus,
    channel: reviewFilters.value.channel,
    startDate: formatFilterDate(range[0]),
    endDate: formatFilterDate(range[1])
  };
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
}

function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString('fr-FR') : '-';
}

function reviewStatusLabel(status?: string) {
  return status === 'archived' ? 'Archivé' : 'Publié';
}

function reviewStatusClass(status?: string) {
  return status === 'archived' ? 'bg-slate-100 text-slate-700 ring-slate-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-100';
}

function ratingClass(rating: number) {
  if (rating >= 4) return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  if (rating === 3) return 'bg-amber-50 text-amber-700 ring-amber-100';
  return 'bg-rose-50 text-rose-700 ring-rose-100';
}

function sentimentLabel(rating: number) {
  if (rating >= 4) return 'Client content';
  if (rating === 3) return 'Avis neutre';
  return 'Client mécontent';
}

function statusClass(status?: string) {
  if (status === 'sent' || status === 'delivered') return 'bg-emerald-50 text-emerald-700';
  if (status === 'failed') return 'bg-red-50 text-red-700';
  if (status === 'skipped') return 'bg-slate-100 text-slate-600';
  return 'bg-amber-50 text-amber-700';
}

function notificationStatusLabel(status?: string) {
  return ({ pending: 'En attente', queued: 'En file', sent: 'Envoyée', delivered: 'Distribuée', skipped: 'Non envoyée', failed: 'Échec' } as Record<string, string>)[status || ''] || 'Non renseigné';
}

function contactAnswers(review: Review) {
  return (review.customAnswers || []).filter((answer) => answer.type === 'email' || answer.type === 'phone' || answer.type === 'fullName');
}

function secondaryAnswers(review: Review) {
  return (review.customAnswers || []).filter((answer) => answer.type !== 'email' && answer.type !== 'phone' && answer.type !== 'fullName').slice(0, 3);
}

function contactIcon(type: string | undefined) {
  if (type === 'fullName') return User;
  return type === 'email' ? Mail : Phone;
}

async function loadReviews() {
  const result = await getReviews(reviewPage.value, pageSize, activeReviewFilters());
  reviews.value = result.reviews;
  reviewPagination.value = result.pagination;
  reviewSearchEngine.value = result.engine || '';
}

async function applyReviewFilters() {
  reviewPage.value = 1;
  await loadReviews();
}

async function loadContactReviews() {
  if (!selectedContact.value) return;
  const result = await getReviews(contactReviewPage.value, contactPageSize, { contactType: selectedContact.value.type, contactValue: selectedContact.value.value });
  contactReviews.value = result.reviews;
  contactPagination.value = result.pagination;
}

async function openContactReviews(answer: NonNullable<Review['customAnswers']>[number]) {
  if (!answer.value) return;
  selectedContact.value = { type: answer.type as 'email' | 'phone' | 'fullName', value: String(answer.value), label: answer.label };
  contactReviewPage.value = 1;
  await loadContactReviews();
}

function closeContactReviews() {
  selectedContact.value = null;
  contactReviews.value = [];
  contactPagination.value = emptyPagination;
}

async function goReviewPage(page: number) {
  reviewPage.value = Math.min(Math.max(page, 1), reviewTotalPages.value);
  await loadReviews();
}

async function goContactReviewPage(page: number) {
  contactReviewPage.value = Math.min(Math.max(page, 1), contactReviewTotalPages.value);
  await loadContactReviews();
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

function openReview(review: Review) {
  selectedReview.value = review;
  moderationDraft.value = {
    moderationStatus: review.moderationStatus === 'archived' ? 'archived' : 'published',
    tags: (review.tags || []).join(', '),
    internalNote: review.internalNote || ''
  };
}

async function saveModeration() {
  if (!selectedReview.value) return;
  const updated = await updateReviewModeration(selectedReview.value._id, {
    moderationStatus: moderationDraft.value.moderationStatus as Review['moderationStatus'],
    tags: moderationDraft.value.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    internalNote: moderationDraft.value.internalNote
  });
  selectedReview.value = updated;
  reviews.value = reviews.value.map((review) => review._id === updated._id ? updated : review);
}

async function archiveReview(review: Review) {
  const updated = await updateReviewModeration(review._id, { moderationStatus: review.moderationStatus === 'archived' ? 'published' : 'archived' });
  reviews.value = reviews.value.map((item) => item._id === updated._id ? updated : item);
}

async function load() {
  const [qrResult] = await Promise.all([getQrCodes(1, 200), loadReviews()]);
  qrCodes.value = qrResult.qrCodes;
}

watch(() => reviewFilters.value.query, () => {
  if (reviewSearchDebounce) clearTimeout(reviewSearchDebounce);
  reviewSearchDebounce = setTimeout(() => {
    applyReviewFilters();
  }, 450);
});

watch(
  [() => reviewFilters.value.rating, () => reviewFilters.value.sentiment, () => reviewFilters.value.qrCodeId, () => reviewFilters.value.moderationStatus, () => reviewFilters.value.channel, () => reviewFilters.value.dateRange],
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
  <section class="grid gap-6">
    <div v-if="!selectedContact" class="grid gap-6">
      <header class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-black text-brand-700">
              <MessageSquareText :size="16" />
              Avis clients
            </p>
            <h2 class="mt-3 text-3xl font-black text-ink">Retours reçus</h2>
            <p class="mt-2 max-w-2xl font-semibold leading-7 text-slate-600">
              Consultez les avis, filtrez rapidement les retours importants, ajoutez des tags et archivez ce qui n'est plus utile.
            </p>
          </div>
          <button class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-black text-white transition hover:bg-brand-600" @click="exportExcel">
            <Download :size="18" />
            Export Excel
          </button>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_130px_150px_180px_150px_minmax(260px,1fr)]">
          <label class="grid gap-1">
            <span class="px-1 text-xs font-black uppercase text-slate-500">Recherche</span>
            <div class="relative">
              <Search class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
              <input v-model="reviewFilters.query" placeholder="Nom, téléphone, tag, commentaire..." class="h-11 w-full rounded-xl border border-slate-300 pl-10 pr-3 font-bold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
            </div>
          </label>
          <label class="grid gap-1">
            <span class="px-1 text-xs font-black uppercase text-slate-500">Note</span>
            <select v-model="reviewFilters.rating" class="h-11 rounded-xl border border-slate-300 bg-white px-3 font-bold outline-none focus:border-brand-700"><option value="">Toutes</option><option v-for="rating in [1, 2, 3, 4, 5]" :key="rating" :value="rating">{{ rating }}/5</option></select>
          </label>
          <label class="grid gap-1">
            <span class="px-1 text-xs font-black uppercase text-slate-500">Sentiment</span>
            <select v-model="reviewFilters.sentiment" class="h-11 rounded-xl border border-slate-300 bg-white px-3 font-bold outline-none focus:border-brand-700"><option value="">Tous</option><option value="positive">Content</option><option value="neutral">Neutre</option><option value="negative">Mécontent</option></select>
          </label>
          <label class="grid gap-1">
            <span class="px-1 text-xs font-black uppercase text-slate-500">QR code</span>
            <select v-model="reviewFilters.qrCodeId" class="h-11 rounded-xl border border-slate-300 bg-white px-3 font-bold outline-none focus:border-brand-700"><option value="">Tous</option><option v-for="qr in qrCodes" :key="qr._id" :value="qr._id">{{ qr.label || qr.slug }}</option></select>
          </label>
          <label class="grid gap-1">
            <span class="px-1 text-xs font-black uppercase text-slate-500">Statut</span>
            <select v-model="reviewFilters.moderationStatus" class="h-11 rounded-xl border border-slate-300 bg-white px-3 font-bold outline-none focus:border-brand-700"><option value="">Tous</option><option value="published">Publiés</option><option value="archived">Archivés</option></select>
          </label>
          <label class="grid min-w-0 gap-1 md:col-span-2 xl:col-span-1">
            <span class="px-1 text-xs font-black uppercase text-slate-500">Période</span>
            <VueDatePicker v-model="reviewFilters.dateRange" :max-date="new Date()" range multi-calendars model-type="yyyy-MM-dd" :formats="{ input: 'dd/MM/yyyy', preview: 'dd/MM/yyyy' }" placeholder="Sélectionner une période" :enable-time-picker="false" auto-apply />
          </label>
        </div>
      </header>

      <section class="grid gap-4 sm:grid-cols-3">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-black uppercase text-slate-500">Avis trouvés</p>
          <strong class="mt-2 block text-3xl font-black text-ink">{{ reviewPagination.total }}</strong>
          <span class="mt-1 block text-sm font-bold text-slate-500">{{ selectedQrLabel }}</span>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-black uppercase text-slate-500">Note moyenne page</p>
          <strong class="mt-2 block text-3xl font-black text-ink">{{ currentReviewsAverage }}/5</strong>
          <span class="mt-1 block text-sm font-bold text-slate-500">Sur les avis affichés</span>
        </article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p class="text-sm font-black uppercase text-slate-500">Archivés page</p>
          <strong class="mt-2 block text-3xl font-black text-ink">{{ archivedOnPage }}</strong>
          <span v-if="reviewSearchEngine" class="mt-1 block text-sm font-bold text-brand-700">Recherche Typesense</span>
          <span v-else class="mt-1 block text-sm font-bold text-slate-500">Liste récente</span>
        </article>
      </section>

      <section class="grid gap-4 xl:grid-cols-2">
        <article v-for="review in reviews" :key="review._id" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-100 hover:shadow-md">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-black ring-1" :class="ratingClass(review.rating)">
                  <Star :size="15" />
                  {{ review.rating }}/5 · {{ sentimentLabel(review.rating) }}
                </span>
                <span class="rounded-full px-3 py-1 text-sm font-black ring-1" :class="reviewStatusClass(review.moderationStatus)">{{ reviewStatusLabel(review.moderationStatus) }}</span>
                <span class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">
                  <CalendarDays :size="14" />
                  {{ formatDate(review.createdAt) }}
                </span>
              </div>

              <h3 class="mt-4 text-lg font-black text-ink">{{ review.qrCode?.label || 'QR code non précisé' }}</h3>
              <p class="mt-2 line-clamp-3 text-base font-semibold leading-7 text-slate-700">{{ review.serviceFeedback || 'Aucun commentaire principal.' }}</p>

              <div v-if="contactAnswers(review).length" class="mt-4 flex flex-wrap gap-2">
                <button v-for="answer in contactAnswers(review)" :key="answer.questionId" class="inline-flex max-w-full items-center gap-2 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-black text-brand-700 transition hover:bg-brand-100" @click="openContactReviews(answer)">
                  <component :is="contactIcon(answer.type)" :size="15" />
                  <span class="truncate">{{ answer.value }}</span>
                </button>
              </div>

              <div v-if="review.tags?.length" class="mt-4 flex flex-wrap gap-2">
                <span v-for="tag in review.tags" :key="tag" class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">
                  <Tag :size="14" />
                  {{ tag }}
                </span>
              </div>
            </div>

            <div class="flex shrink-0 flex-row gap-2 lg:flex-col">
              <button class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 font-black text-ink transition hover:bg-slate-50" @click="openReview(review)">
                <Eye :size="17" />
                Détail
              </button>
              <button class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 font-black text-slate-700 transition hover:bg-slate-50" @click="archiveReview(review)">
                <Archive :size="17" />
                {{ review.moderationStatus === 'archived' ? 'Désarchiver' : 'Archiver' }}
              </button>
            </div>
          </div>
        </article>

        <div v-if="!reviews.length" class="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <strong class="block text-xl font-black text-ink">Aucun avis trouvé.</strong>
          <span class="mt-2 block font-semibold text-slate-500">Essayez un autre filtre ou attendez les prochains scans QR.</span>
        </div>
      </section>

      <BasePagination :pagination="reviewPagination" :page="reviewPage" label="avis au total" @page-change="goReviewPage" />
    </div>

    <div v-else class="grid gap-5">
      <div class="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button class="mb-3 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 font-black text-ink transition hover:bg-slate-50" @click="closeContactReviews">
            <ChevronLeft :size="17" />
            Retour aux avis
          </button>
          <h2 class="text-2xl font-black text-ink">Historique du contact</h2>
          <p class="mt-1 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 font-black text-brand-700">
            <component :is="selectedContact.type === 'email' ? Mail : Phone" :size="16" />
            {{ contactTitle }}
          </p>
        </div>
        <span class="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600">{{ contactPagination.total }} avis</span>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="review in contactReviews" :key="review._id" class="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-sm font-black text-slate-500">{{ formatDate(review.createdAt) }}</p>
              <strong class="mt-1 block text-2xl font-black text-brand-700">{{ review.rating }}/5</strong>
            </div>
            <span class="rounded-full px-3 py-1 text-sm font-black ring-1" :class="reviewStatusClass(review.moderationStatus)">{{ reviewStatusLabel(review.moderationStatus) }}</span>
          </div>
          <p class="mt-4 line-clamp-4 flex-1 font-semibold text-slate-700">{{ review.serviceFeedback || 'Aucun commentaire principal.' }}</p>
          <div class="mt-4 grid gap-2">
            <p v-for="answer in secondaryAnswers(review)" :key="answer.questionId" class="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600">
              <span class="font-black text-ink">{{ answer.label }}:</span> {{ answer.value || '-' }}
            </p>
          </div>
          <button class="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-300 font-black text-ink transition hover:bg-slate-50" @click="openReview(review)">
            <Eye :size="16" />
            Voir le détail
          </button>
        </article>
        <div v-if="!contactReviews.length" class="rounded-2xl bg-slate-50 p-6 font-bold text-slate-600">Aucun avis trouvé pour ce contact.</div>
      </div>
      <BasePagination :pagination="contactPagination" :page="contactReviewPage" label="avis pour ce contact" @page-change="goContactReviewPage" />
    </div>

    <div v-if="selectedReview" class="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" @click.self="selectedReview = null">
      <div class="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <p class="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-black text-brand-700">
              <MessageSquareText :size="15" />
              Avis client
            </p>
            <h2 class="text-2xl font-black text-ink">{{ selectedReview.qrCode?.label || 'QR code' }}</h2>
            <p class="mt-1 text-sm font-bold text-slate-500">{{ formatDateTime(selectedReview.createdAt) }}</p>
          </div>
          <button class="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-ink" aria-label="Fermer" @click="selectedReview = null"><X :size="18" /></button>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl p-4 ring-1" :class="ratingClass(selectedReview.rating)">
            <p class="text-xs font-black uppercase">Note</p>
            <strong class="mt-1 block text-2xl font-black">{{ selectedReview.rating }}/5</strong>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-black uppercase text-slate-500">Statut</p>
            <strong class="mt-1 block text-ink">{{ reviewStatusLabel(selectedReview.moderationStatus) }}</strong>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-black uppercase text-slate-500">Email notification</p>
            <span class="mt-2 inline-flex rounded-full px-3 py-1 text-sm font-black" :class="statusClass(selectedReview.emailNotificationStatus)">{{ notificationStatusLabel(selectedReview.emailNotificationStatus) }}</span>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <p class="text-xs font-black uppercase text-slate-500">Telegram notification</p>
            <span class="mt-2 inline-flex rounded-full px-3 py-1 text-sm font-black" :class="statusClass(selectedReview.notificationStatus)">{{ notificationStatusLabel(selectedReview.notificationStatus) }}</span>
          </div>
        </div>

        <div class="mt-5 rounded-2xl border border-slate-200 p-4">
          <p class="text-xs font-black uppercase text-slate-500">Expérience client</p>
          <p class="mt-2 whitespace-pre-line text-base font-semibold leading-7 text-ink">{{ selectedReview.serviceFeedback || '-' }}</p>
        </div>

        <div v-if="selectedReview.customAnswers?.length" class="mt-4 grid gap-3 sm:grid-cols-2">
          <div v-for="answer in selectedReview.customAnswers" :key="answer.questionId" class="rounded-2xl border border-slate-200 p-4">
            <p class="text-xs font-black uppercase text-slate-500">{{ answer.label }}</p>
            <p class="mt-2 break-words font-semibold text-ink">{{ answer.value || '-' }}</p>
          </div>
        </div>

        <div class="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <label class="grid gap-1">
            <span class="text-xs font-black uppercase text-slate-500">Statut</span>
            <select v-model="moderationDraft.moderationStatus" class="h-11 rounded-xl border border-slate-300 bg-white px-3 font-bold outline-none focus:border-brand-700">
              <option value="published">Publié</option>
              <option value="archived">Archivé</option>
            </select>
          </label>
          <label class="grid gap-1">
            <span class="text-xs font-black uppercase text-slate-500">Tags</span>
            <input v-model="moderationDraft.tags" placeholder="attente, accueil, prix" class="h-11 rounded-xl border border-slate-300 bg-white px-3 font-bold outline-none focus:border-brand-700" />
          </label>
          <label class="grid gap-1">
            <span class="text-xs font-black uppercase text-slate-500">Note interne</span>
            <textarea v-model="moderationDraft.internalNote" rows="3" class="rounded-xl border border-slate-300 bg-white px-3 py-2 font-semibold outline-none focus:border-brand-700" />
          </label>
          <button class="h-11 rounded-xl bg-brand-700 px-4 font-black text-white transition hover:bg-brand-600" @click="saveModeration">Enregistrer</button>
        </div>
      </div>
    </div>
  </section>
</template>
