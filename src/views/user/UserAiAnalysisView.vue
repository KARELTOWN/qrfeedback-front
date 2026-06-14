<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Bot, MessageSquareText, RefreshCw, Search, Star } from 'lucide-vue-next';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import BasePagination from '../../components/shared/BasePagination.vue';
import { useDashboard, type AiOverview, type AiSearchResult, type CompanyQrCode, type Review } from '../../composables/useDashboard';

const { getAiOverview, getQrCodes, searchAiReviews, reindexAiReviews } = useDashboard();
const route = useRoute();
const router = useRouter();
const aiOverview = ref<AiOverview | null>(null);
const aiSearchResult = ref<AiSearchResult | null>(null);
const aiSearchQuery = ref('');
const aiSearchPage = ref(1);
const aiMessage = ref('');
const aiLoading = ref(false);
const selectedReview = ref<Review | null>(null);
const aiDateRange = ref<string[] | null>(null);
const qrCodes = ref<CompanyQrCode[]>([]);
const selectedQrCodeId = ref('');

const sentimentBars = computed(() => {
  const sentiment = aiOverview.value?.sentiment;
  if (!sentiment) return [];
  return [
    { key: 'positive', label: 'Positif', count: sentiment.positive, color: 'bg-emerald-600' },
    { key: 'neutral', label: 'Neutre', count: sentiment.neutral, color: 'bg-slate-500' },
    { key: 'negative', label: 'Négatif', count: sentiment.negative, color: 'bg-rose-600' }
  ];
});
const scoreEvolution = computed(() => {
  const delta = aiOverview.value?.trends.averageDelta || 0;
  if (delta > 0) return { label: `+${delta} pts`, className: 'text-emerald-700' };
  if (delta < 0) return { label: `${delta} pts`, className: 'text-rose-700' };
  return { label: 'Stable', className: 'text-slate-700' };
});
const previousPeriodLabel = computed(() => {
  const range = aiDateRange.value || [];
  if (!range[0] || !range[1]) return 'vs période précédente';
  const start = new Date(`${range[0]}T00:00:00`);
  const end = new Date(`${range[1]}T23:59:59`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'vs période précédente';
  const duration = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);
  return `vs ${formatDisplayDate(formatDateString(previousStart))} au ${formatDisplayDate(formatDateString(previousEnd))}`;
});
function impactClass(impact: string) { if (impact === 'high') return 'bg-rose-50 text-rose-700'; if (impact === 'medium') return 'bg-amber-50 text-amber-700'; return 'bg-slate-100 text-slate-700'; }
function formatDate(value: string) { return new Date(value).toLocaleDateString('fr-FR'); }
function formatDateString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function formatDisplayDate(value: string) {
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : value;
}
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
function parseFilterDate(value: unknown) {
  if (!value || typeof value !== 'string') return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : value;
}
function currentMonthRange() {
  const now = new Date();
  return [formatDateString(new Date(now.getFullYear(), now.getMonth(), 1)), formatDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0))];
}
function getRangeQuery() {
  const range = aiDateRange.value || [];
  return {
    startDate: formatFilterDate(range[0]),
    endDate: formatFilterDate(range[1]),
    qrCodeId: selectedQrCodeId.value || undefined
  };
}
async function syncRangeToUrl() {
  const query = getRangeQuery();
  await router.replace({ path: route.path, query: { ...route.query, ...query } });
}
async function applyDateRange() {
  const range = aiDateRange.value || [];
  if (!range[0] && !range[1]) aiDateRange.value = currentMonthRange();
  if (!range[0] || !range[1]) return;
  await syncRangeToUrl();
  aiSearchPage.value = 1;
  await loadAiOverview();
  if (aiSearchQuery.value.trim()) await runAiSearch(1);
}
async function applyQrCodeFilter() {
  await syncRangeToUrl();
  aiSearchPage.value = 1;
  await loadAiOverview();
  if (aiSearchQuery.value.trim()) await runAiSearch(1);
}
async function loadQrCodes() {
  const result = await getQrCodes(1, 100);
  qrCodes.value = result.qrCodes;
}
async function loadAiOverview() {
  const range = getRangeQuery();
  aiOverview.value = await getAiOverview(range.startDate, range.endDate, range.qrCodeId);
}
async function runAiSearch(page = 1) {
  if (!aiSearchQuery.value.trim()) { aiSearchResult.value = null; return; }
  aiLoading.value = true;
  aiSearchPage.value = page;
  try { aiSearchResult.value = await searchAiReviews(aiSearchQuery.value, aiSearchPage.value, 10, getRangeQuery()); } finally { aiLoading.value = false; }
}
async function goAiSearchPage(page: number) { await runAiSearch(page); }
async function rebuildAiIndex() {
  aiMessage.value = '';
  aiLoading.value = true;
  try {
    const result = await reindexAiReviews();
    aiMessage.value = result.enabled ? `${result.indexed} avis indexés pour la recherche sémantique.` : 'Typesense n est pas configuré.';
    await loadAiOverview();
    if (aiSearchQuery.value.trim()) await runAiSearch(aiSearchPage.value);
  } catch (err) { aiMessage.value = err instanceof Error ? err.message : 'Erreur inconnue'; } finally { aiLoading.value = false; }
}
onMounted(async () => {
  const startDate = parseFilterDate(route.query.startDate);
  const endDate = parseFilterDate(route.query.endDate);
  selectedQrCodeId.value = typeof route.query.qrCodeId === 'string' ? route.query.qrCodeId : '';
  aiDateRange.value = startDate && endDate ? [startDate, endDate] : currentMonthRange();
  await loadQrCodes();
  if (!startDate || !endDate) await syncRangeToUrl();
  await loadAiOverview();
});
watch(() => [route.query.startDate, route.query.endDate, route.query.qrCodeId], async ([start, end, qrCodeId]) => {
  const startDate = parseFilterDate(start);
  const endDate = parseFilterDate(end);
  if (!startDate || !endDate) return;
  const current = aiDateRange.value || [];
  const nextQrCodeId = typeof qrCodeId === 'string' ? qrCodeId : '';
  if (formatFilterDate(current[0]) === startDate && formatFilterDate(current[1]) === endDate && selectedQrCodeId.value === nextQrCodeId) return;
  aiDateRange.value = [startDate, endDate];
  selectedQrCodeId.value = nextQrCodeId;
  await loadAiOverview();
});
</script>

<template>
  <section class="grid gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4"><div><h2 class="text-2xl font-black text-ink">Analyse IA</h2><p class="mt-1 font-semibold text-slate-500">{{ aiOverview?.totalReviews || 0 }} avis analysés sur la période sélectionnée</p></div><div class="grid w-full gap-3 md:w-auto md:min-w-[560px] lg:grid-cols-[220px_minmax(280px,1fr)_auto] lg:items-center"><select v-model="selectedQrCodeId" class="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-4 font-bold text-ink outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" @change="applyQrCodeFilter"><option value="">Tous les QR codes</option><option v-for="qrCode in qrCodes" :key="qrCode._id" :value="qrCode._id">{{ qrCode.label || qrCode.slug }}</option></select><VueDatePicker v-model="aiDateRange" range multi-calendars model-type="yyyy-MM-dd" :formats="{ input: 'dd/MM/yyyy', preview: 'dd/MM/yyyy' }" placeholder="Sélectionner une période" :enable-time-picker="false" :clearable="false" auto-apply teleport-center @update:model-value="applyDateRange" /><button class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-4 font-black text-white transition hover:bg-black" :disabled="aiLoading" @click="rebuildAiIndex"><RefreshCw :size="17" :class="{ 'animate-spin': aiLoading }" /> Rafraichir</button></div></div>
    <p v-if="aiMessage" class="rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700">{{ aiMessage }}</p>

    <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]"><article class="rounded-2xl border border-slate-200 p-5"><div class="mb-4 flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-700 text-white"><Bot :size="21" /></span><h3 class="text-xl font-black text-ink">Résumé des tendances</h3></div><p class="text-lg font-bold leading-8 text-slate-700">{{ aiOverview?.trends.text || 'Aucune donnée disponible.' }}</p><div class="mt-5 grid gap-3 sm:grid-cols-3"><div class="rounded-xl bg-slate-50 p-4"><p class="text-xs font-black uppercase text-slate-500">Avis analysés</p><strong class="mt-1 block text-2xl font-black text-ink">{{ aiOverview?.trends.recentCount || 0 }}</strong></div><div class="rounded-xl bg-slate-50 p-4"><p class="text-xs font-black uppercase text-slate-500">Note moyenne</p><strong class="mt-1 block text-2xl font-black text-ink">{{ aiOverview?.trends.recentAverage || 0 }}/5</strong></div><div class="rounded-xl bg-slate-50 p-4"><p class="text-xs font-black uppercase text-slate-500">Évolution de la note</p><strong class="mt-1 block text-2xl font-black" :class="scoreEvolution.className">{{ scoreEvolution.label }}</strong><span class="mt-1 block text-xs font-black text-slate-500">{{ previousPeriodLabel }}</span></div></div></article>
    <article class="rounded-2xl border border-slate-200 p-5"><div class="mb-4 flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-xl bg-emerald-700 text-white"><Star :size="21" /></span><h3 class="text-xl font-black text-ink">Sentiment</h3></div><div class="grid gap-4"><div v-for="item in sentimentBars" :key="item.key" class="grid grid-cols-[82px_1fr_44px] items-center gap-3"><span class="font-black text-ink">{{ item.label }}</span><div class="h-4 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full" :class="item.color" :style="{ width: `${aiOverview?.totalReviews ? (item.count / aiOverview.totalReviews) * 100 : 0}%` }"></div></div><span class="text-right font-black text-ink">{{ item.count }}</span></div></div><div class="mt-5 grid grid-cols-2 gap-3"><div class="rounded-xl bg-emerald-50 p-4 text-emerald-800"><p class="text-xs font-black uppercase">Positif</p><strong class="text-2xl font-black">{{ aiOverview?.sentiment.positiveRate || 0 }}%</strong></div><div class="rounded-xl bg-rose-50 p-4 text-rose-800"><p class="text-xs font-black uppercase">Négatif</p><strong class="text-2xl font-black">{{ aiOverview?.sentiment.negativeRate || 0 }}%</strong></div></div></article></section>

    <section class="rounded-2xl border border-slate-200 p-5"><div class="mb-5 flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-xl bg-rose-700 text-white"><MessageSquareText :size="21" /></span><h3 class="text-xl font-black text-ink">Problèmes fréquents</h3></div><div class="grid gap-4 xl:grid-cols-2"><article v-for="problem in aiOverview?.problems || []" :key="problem.key" class="rounded-2xl bg-slate-50 p-5"><div class="flex items-start justify-between gap-3"><div><h4 class="text-lg font-black text-ink">{{ problem.label }}</h4><p class="mt-1 font-semibold text-slate-500">{{ problem.count }} mention(s), note moyenne {{ problem.averageRating }}/5</p></div><span class="rounded-full px-3 py-1 text-xs font-black uppercase" :class="impactClass(problem.impact)">{{ problem.impact }}</span></div><div class="mt-4 grid gap-3"><button v-for="example in problem.examples" :key="example.id" class="rounded-xl bg-white p-3 text-left font-semibold text-slate-700 transition hover:ring-2 hover:ring-brand-100"><span class="mb-1 block text-xs font-black text-brand-700">{{ example.rating }}/5 - {{ formatDate(example.createdAt) }}</span>{{ example.text }}</button></div></article></div><p v-if="!aiOverview?.problems?.length" class="rounded-xl bg-slate-50 p-5 font-bold text-slate-500">Aucun problème fréquent détecté.</p></section>

    <section class="rounded-2xl border border-slate-200 p-5"><div class="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 class="text-xl font-black text-ink">Recherche des avis similaires</h3><span v-if="aiSearchResult?.engine" class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-600">{{ aiSearchResult.engine }}</span></div><form class="flex flex-col gap-3 sm:flex-row" @submit.prevent="runAiSearch(1)"><input v-model="aiSearchQuery" placeholder="Ex: clients mécontents du temps d'attente" class="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 font-bold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" /><button class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-black text-white" :disabled="aiLoading"><Search :size="17" /> Rechercher</button></form><div v-if="aiSearchResult" class="mt-5 grid gap-3"><button v-for="review in aiSearchResult.reviews" :key="review._id" class="rounded-2xl bg-slate-50 p-4 text-left transition hover:ring-2 hover:ring-brand-100" @click="selectedReview = review"><span class="mb-2 block text-sm font-black text-brand-700">{{ review.rating }}/5 - {{ new Date(review.createdAt).toLocaleString('fr-FR') }}</span><p class="line-clamp-3 font-semibold text-slate-700">{{ review.serviceFeedback || 'Aucun commentaire principal.' }}</p></button><BasePagination v-if="aiSearchResult.pagination.totalPages > 1" :pagination="aiSearchResult.pagination" :page="aiSearchPage" label="avis similaires" @page-change="goAiSearchPage" /><p v-if="!aiSearchResult.reviews.length" class="rounded-xl bg-slate-50 p-4 font-bold text-slate-500">Aucun avis similaire trouvé.</p></div></section>

    <div v-if="selectedReview" class="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" @click.self="selectedReview = null"><div class="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><button class="float-right rounded-xl bg-slate-100 px-3 py-2 font-black" @click="selectedReview = null">Fermer</button><h2 class="text-2xl font-black text-ink">Détail de l'avis</h2><p class="mt-2 font-black text-brand-700">{{ selectedReview.rating }}/5</p><p class="mt-4 whitespace-pre-line font-semibold text-slate-700">{{ selectedReview.serviceFeedback || '-' }}</p></div></div>
  </section>
</template>
