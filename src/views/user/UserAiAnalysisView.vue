<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AlertTriangle, BrainCircuit, Lightbulb, MessageSquareText, RefreshCw, Search, Sparkles, Star, TrendingUp } from 'lucide-vue-next';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import BasePagination from '../../components/shared/BasePagination.vue';
import { useDashboard, type AiAnalysis, type AiSearchResult, type CompanyQrCode, type Review } from '../../composables/useDashboard';

const { analyse, getRecommendations, getQrCodes, searchAiReviews, reindexAiReviews } = useDashboard();
const route = useRoute();
const router = useRouter();
const aiOverview = ref<AiAnalysis | null>(null);
const aiSearchResult = ref<AiSearchResult | null>(null);
const aiSearchQuery = ref('');
const aiSearchPage = ref(1);
const aiMessage = ref('');
const aiLoading = ref(false);
const recommendationsLoading = ref(false);
const recommendationItems = ref<Array<{ priority: 'high' | 'medium' | 'low'; title: string; action: string; reason: string }>>([]);
const recommendationQuota = ref<{ remaining: number; resetAt: string } | null>(null);
const selectedReview = ref<Review | null>(null);
const aiDateRange = ref<string[] | null>(null);
const comparisonDateRange = ref<string[] | null>(null);
const qrCodes = ref<CompanyQrCode[]>([]);
const selectedQrCodeId = ref('');

const selectedQrCodeLabel = computed(() => {
  if (!selectedQrCodeId.value) return 'Tous les QR codes';
  const qrCode = qrCodes.value.find((item) => item._id === selectedQrCodeId.value);
  return qrCode?.label || qrCode?.slug || 'QR code sélectionné';
});

const totalReviews = computed(() => aiOverview.value?.totalReviews || 0);
const averageRating = computed(() => aiOverview.value?.trends.recentAverage || 0);
const positiveRate = computed(() => aiOverview.value?.sentiment.positiveRate || 0);
const negativeRate = computed(() => aiOverview.value?.sentiment.negativeRate || 0);
const topProblem = computed(() => aiOverview.value?.problems?.[0]);
const topProblems = computed(() => (aiOverview.value?.problems || []).slice(0, 4));

const scoreEvolution = computed(() => {
  const delta = aiOverview.value?.trends.averageDelta || 0;
  if (delta > 0) return { label: `+${delta} point`, className: 'text-emerald-700', iconClass: 'bg-emerald-50 text-emerald-700' };
  if (delta < 0) return { label: `${delta} point`, className: 'text-rose-700', iconClass: 'bg-rose-50 text-rose-700' };
  return { label: 'Stable', className: 'text-slate-700', iconClass: 'bg-slate-100 text-slate-700' };
});

const sentimentBars = computed(() => {
  const sentiment = aiOverview.value?.sentiment;
  if (!sentiment) return [];
  return [
    { key: 'positive', label: 'Clients contents', count: sentiment.positive, percent: sentimentPercent(sentiment.positive), color: 'bg-emerald-600', soft: 'bg-emerald-50 text-emerald-800' },
    { key: 'neutral', label: 'Avis neutres', count: sentiment.neutral, percent: sentimentPercent(sentiment.neutral), color: 'bg-amber-500', soft: 'bg-amber-50 text-amber-800' },
    { key: 'negative', label: 'Clients mécontents', count: sentiment.negative, percent: sentimentPercent(sentiment.negative), color: 'bg-rose-600', soft: 'bg-rose-50 text-rose-800' }
  ];
});

const previousPeriodLabel = computed(() => {
  const comparison = comparisonDateRange.value || [];
  if (comparison[0] && comparison[1]) return `${formatDisplayDate(comparison[0])} - ${formatDisplayDate(comparison[1])}`;
  const range = aiDateRange.value || [];
  if (!range[0] || !range[1]) return 'période précédente';
  const start = new Date(`${range[0]}T00:00:00`);
  const end = new Date(`${range[1]}T23:59:59`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'période précédente';
  const duration = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);
  return `${formatDisplayDate(formatDateString(previousStart))} - ${formatDisplayDate(formatDateString(previousEnd))}`;
});

const periodLabel = computed(() => {
  const range = aiDateRange.value || [];
  if (!range[0] || !range[1]) return 'Période en cours';
  return `${formatDisplayDate(range[0])} - ${formatDisplayDate(range[1])}`;
});

const recommendation = computed(() => {
  if (!totalReviews.value) return 'Aucun avis sur cette période. Commencez par vérifier que vos QR codes sont visibles et faciles à scanner.';
  if (negativeRate.value >= 50) return `Signal d’alerte : ${negativeRate.value}% des avis de cette période sont négatifs. Consultez cet avis et agissez avant de tirer une conclusion sur la tendance.`;
  if (negativeRate.value >= 30 && topProblem.value) return `Priorité: corriger "${cleanText(topProblem.value.label)}". Ce sujet revient souvent et tire la satisfaction vers le bas.`;
  if (averageRating.value < 3.5 && topProblem.value) return `Action utile: corriger d'abord "${cleanText(topProblem.value.label)}", puis demander de nouveaux avis pour mesurer l'amélioration.`;
  if (positiveRate.value >= 70) return 'La satisfaction est bonne. Gardez les bonnes pratiques et surveillez les sujets qui apparaissent plusieurs fois.';
  if (topProblem.value) return `À suivre: "${cleanText(topProblem.value.label)}" revient dans ${topProblem.value.count} avis.`;
  return 'Les avis sont globalement stables. Continuez à suivre les tendances chaque semaine.';
});

function cleanText(value?: string) {
  if (!value) return '';
  return value
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã«/g, 'ë')
    .replace(/Ã /g, 'à')
    .replace(/Ã¢/g, 'â')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã»/g, 'û')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã¹/g, 'ù')
    .replace(/Ã®/g, 'î')
    .replace(/Ã¯/g, 'ï')
    .replace(/Å“/g, 'œ')
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"');
}

function sentimentPercent(count: number) {
  if (!totalReviews.value) return 0;
  return Math.round((count / totalReviews.value) * 100);
}

function impactLabel(impact: string) {
  if (impact === 'high') return 'Priorité haute';
  if (impact === 'medium') return 'À surveiller';
  return 'Faible impact';
}

function impactClass(impact: string) {
  if (impact === 'high') return 'bg-rose-50 text-rose-700 ring-rose-100';
  if (impact === 'medium') return 'bg-amber-50 text-amber-700 ring-amber-100';
  return 'bg-slate-100 text-slate-700 ring-slate-200';
}

function engineLabel(engine?: string) {
  if (engine === 'typesense') return 'Recherche IA';
  if (engine === 'mongo-fallback') return 'Recherche simple';
  return 'Recherche';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR');
}

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
    comparisonStartDate: formatFilterDate(comparisonDateRange.value?.[0]),
    comparisonEndDate: formatFilterDate(comparisonDateRange.value?.[1]),
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
  aiOverview.value = await analyse(range);
}

async function loadRecommendations() {
  if (!aiOverview.value) return;
  recommendationsLoading.value = true;
  aiMessage.value = '';
  try {
    const result = await getRecommendations(aiOverview.value);
    recommendationItems.value = result.recommendations;
    recommendationQuota.value = result.quota || null;
  } catch (error) {
    aiMessage.value = error instanceof Error ? error.message : 'Impossible de générer les recommandations.';
  } finally {
    recommendationsLoading.value = false;
  }
}

async function runAiSearch(page = 1) {
  if (!aiSearchQuery.value.trim()) {
    aiSearchResult.value = null;
    return;
  }
  aiLoading.value = true;
  aiSearchPage.value = page;
  try {
    aiSearchResult.value = await searchAiReviews(aiSearchQuery.value, aiSearchPage.value, 10, getRangeQuery());
  } finally {
    aiLoading.value = false;
  }
}

async function goAiSearchPage(page: number) {
  await runAiSearch(page);
}

async function rebuildAiIndex() {
  aiMessage.value = '';
  aiLoading.value = true;
  try {
    const result = await reindexAiReviews();
    aiMessage.value = result.enabled ? `${result.indexed} avis indexés pour la recherche IA.` : "La recherche IA n'est pas configurée.";
    await loadAiOverview();
    if (aiSearchQuery.value.trim()) await runAiSearch(aiSearchPage.value);
  } catch (err) {
    aiMessage.value = err instanceof Error ? err.message : 'Erreur inconnue.';
  } finally {
    aiLoading.value = false;
  }
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
    <header class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div class="max-w-3xl">
          <div class="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-black text-brand-700">
            <BrainCircuit :size="16" />
            Analyse IA
          </div>
          <h2 class="text-3xl font-black leading-tight text-ink">Comprendre les avis clients</h2>
          <p class="mt-2 max-w-2xl font-semibold leading-7 text-slate-600">
            Vue simple des tendances, des points forts et des sujets à corriger pour {{ selectedQrCodeLabel }}.
          </p>
        </div>

        <div class="grid w-full gap-3 xl:w-[680px] xl:grid-cols-[220px_minmax(280px,1fr)_auto] xl:items-center">
          <select v-model="selectedQrCodeId" class="h-11 min-w-0 rounded-xl border border-slate-300 bg-white px-4 font-bold text-ink outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" @change="applyQrCodeFilter">
            <option value="">Tous les QR codes</option>
            <option v-for="qrCode in qrCodes" :key="qrCode._id" :value="qrCode._id">{{ qrCode.label || qrCode.slug }}</option>
          </select>
          <VueDatePicker v-model="aiDateRange" :max-date="new Date()" range multi-calendars model-type="yyyy-MM-dd" :formats="{ input: 'dd/MM/yyyy', preview: 'dd/MM/yyyy' }" placeholder="Sélectionner une période" :enable-time-picker="false" :clearable="false" auto-apply teleport-center @update:model-value="applyDateRange" />
          <VueDatePicker v-model="comparisonDateRange" :max-date="new Date()" range multi-calendars model-type="yyyy-MM-dd" :formats="{ input: 'dd/MM/yyyy', preview: 'dd/MM/yyyy' }" placeholder="Comparer avec une période" :enable-time-picker="false" auto-apply teleport-center @update:model-value="loadAiOverview" />
          <button class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-4 font-black text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-70" :disabled="aiLoading" @click="rebuildAiIndex">
            <RefreshCw :size="17" :class="{ 'animate-spin': aiLoading }" />
            Actualiser
          </button>
        </div>
      </div>
      <p v-if="aiMessage" class="mt-4 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700">{{ aiMessage }}</p>
    </header>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-black uppercase text-slate-500">Avis analysés</p>
        <strong class="mt-2 block text-3xl font-black text-ink">{{ totalReviews }}</strong>
        <span class="mt-1 block text-sm font-bold text-slate-500">{{ periodLabel }}</span>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-black uppercase text-slate-500">Note moyenne</p>
        <strong class="mt-2 block text-3xl font-black text-ink">{{ averageRating }}/5</strong>
        <span class="mt-1 block text-sm font-bold" :class="scoreEvolution.className">{{ scoreEvolution.label }} vs {{ previousPeriodLabel }}</span>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-black uppercase text-slate-500">Clients contents</p>
        <strong class="mt-2 block text-3xl font-black text-emerald-700">{{ positiveRate }}%</strong>
        <span class="mt-1 block text-sm font-bold text-slate-500">Avis à 4 ou 5 étoiles</span>
      </article>
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-black uppercase text-slate-500">Clients mécontents</p>
        <strong class="mt-2 block text-3xl font-black text-rose-700">{{ negativeRate }}%</strong>
        <span class="mt-1 block text-sm font-bold text-slate-500">Avis à 1 ou 2 étoiles</span>
      </article>
    </section>

    <section v-if="aiOverview?.comparisonPeriod?.startDate" class="grid gap-4 md:grid-cols-2">
      <article class="rounded-3xl border border-brand-100 bg-brand-50 p-5"><p class="text-sm font-black text-brand-700">Période A — actuelle</p><strong class="mt-2 block text-3xl font-black text-ink">{{ aiOverview.reviews.count }} avis</strong><div class="mt-4 h-3 rounded-full bg-white"><div class="h-3 rounded-full bg-brand-700" :style="{ width: `${Math.min(100, aiOverview.scans.count ? aiOverview.reviews.count / aiOverview.scans.count * 100 : 0)}%` }"></div></div><p class="mt-3 font-bold text-slate-600">{{ aiOverview.scans.count }} scans · {{ aiOverview.reviews.averageRating }}/5</p></article>
      <article class="rounded-3xl border border-amber-100 bg-amber-50 p-5"><p class="text-sm font-black text-amber-700">Période B — comparaison</p><strong class="mt-2 block text-3xl font-black text-ink">{{ aiOverview.comparison.previousReviewCount }} avis</strong><div class="mt-4 h-3 rounded-full bg-white"><div class="h-3 rounded-full bg-amber-500" :style="{ width: `${Math.min(100, aiOverview.comparison.previousScanCount ? aiOverview.comparison.previousReviewCount / aiOverview.comparison.previousScanCount * 100 : 0)}%` }"></div></div><p class="mt-3 font-bold text-slate-600">{{ aiOverview.comparison.previousScanCount }} scans · {{ aiOverview.comparison.previousAverageRating }}/5</p></article>
    </section>

    <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-start gap-3">
          <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-700 text-white"><Lightbulb :size="22" /></span>
          <div>
            <h3 class="text-xl font-black text-ink">À faire en priorité</h3>
            <p class="mt-1 font-semibold text-slate-500">La recommandation la plus utile d'après les avis sélectionnés.</p>
          </div>
        </div>
        <div class="rounded-2xl border border-brand-100 bg-brand-50 p-4">
          <p class="text-xs font-black uppercase tracking-wide text-brand-700">Lecture rapide</p>
          <p class="mt-1 font-bold leading-6 text-brand-950">{{ recommendation }}</p>
        </div>
        <button class="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 font-black text-white disabled:cursor-wait disabled:opacity-70" :disabled="recommendationsLoading || !aiOverview" @click="loadRecommendations">
          <Sparkles :size="17" :class="{ 'animate-pulse': recommendationsLoading }" />
          {{ recommendationsLoading ? 'Préparation…' : 'Obtenir des recommandations' }}
        </button>
        <span v-if="recommendationQuota" class="ml-3 text-sm font-bold text-slate-500">{{ recommendationQuota.remaining }}/7 restantes · remise à zéro le {{ formatDate(recommendationQuota.resetAt) }}</span>
        <div v-if="recommendationItems.length" class="mt-5 grid gap-3">
          <p class="text-xs font-black uppercase tracking-wide text-slate-500">Plan d’action recommandé</p>
          <article v-for="(item, index) in recommendationItems" :key="item.title" class="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="absolute inset-y-0 left-0 w-1 rounded-l-2xl" :class="item.priority === 'high' ? 'bg-rose-500' : item.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'"></div>
            <div class="pl-3"><div class="flex flex-wrap items-center justify-between gap-2"><h4 class="font-black text-ink">{{ index + 1 }}. {{ item.title }}</h4><span class="rounded-full px-2.5 py-1 text-xs font-black" :class="item.priority === 'high' ? 'bg-rose-50 text-rose-700' : item.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'">{{ item.priority === 'high' ? 'Priorité haute' : item.priority === 'medium' ? 'Priorité moyenne' : 'À consolider' }}</span></div><p class="mt-3 font-bold leading-6 text-slate-800">{{ item.action }}</p><p class="mt-3 border-t border-slate-100 pt-3 text-sm leading-5 text-slate-500"><span class="font-black text-slate-600">Pourquoi :</span> {{ item.reason }}</p></div>
          </article>
        </div>
        <p class="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold leading-6 text-slate-500">{{ cleanText(aiOverview?.trends.text) || 'Aucune tendance disponible pour le moment.' }}</p>
      </article>

      <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-start gap-3">
          <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" :class="scoreEvolution.iconClass"><TrendingUp :size="22" /></span>
          <div>
            <h3 class="text-xl font-black text-ink">Sentiment des clients</h3>
            <p class="mt-1 font-semibold text-slate-500">Répartition simple des avis.</p>
          </div>
        </div>
        <div class="grid gap-4">
          <div v-for="item in sentimentBars" :key="item.key" class="grid gap-2">
            <div class="flex items-center justify-between gap-3">
              <span class="font-black text-ink">{{ item.label }}</span>
              <span class="rounded-full px-3 py-1 text-sm font-black" :class="item.soft">{{ item.percent }}% · {{ item.count }}</span>
            </div>
            <div class="h-3 overflow-hidden rounded-full bg-slate-100">
              <div class="h-full rounded-full" :class="item.color" :style="{ width: `${item.percent}%` }"></div>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 class="text-xl font-black text-ink">Sujets qui reviennent souvent</h3>
          <p class="mt-1 font-semibold text-slate-500">Les thèmes à surveiller, classés par impact et fréquence.</p>
        </div>
        <span class="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">
          <AlertTriangle :size="15" />
          {{ topProblems.length }} sujet(s)
        </span>
      </div>

      <div v-if="topProblems.length" class="grid gap-4 lg:grid-cols-2">
        <article v-for="problem in topProblems" :key="problem.key" class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h4 class="text-lg font-black text-ink">{{ cleanText(problem.label) }}</h4>
              <p class="mt-1 font-semibold text-slate-500">{{ problem.count }} mention(s), note moyenne {{ problem.averageRating }}/5</p>
            </div>
            <span class="rounded-full px-3 py-1 text-xs font-black uppercase ring-1" :class="impactClass(problem.impact)">{{ impactLabel(problem.impact) }}</span>
          </div>
          <div class="mt-4 grid gap-3">
            <button v-for="example in problem.examples" :key="example.id" class="rounded-xl bg-white p-3 text-left font-semibold text-slate-700 transition hover:ring-2 hover:ring-brand-100">
              <span class="mb-1 block text-xs font-black text-brand-700">{{ example.rating }}/5 - {{ formatDate(example.createdAt) }}</span>
              {{ cleanText(example.text) }}
            </button>
          </div>
        </article>
      </div>

      <p v-else class="rounded-2xl bg-slate-50 p-6 font-bold text-slate-500">
        Aucun sujet récurrent détecté sur cette période.
      </p>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-xl font-black text-ink">Retrouver des avis similaires</h3>
          <p class="mt-1 font-semibold text-slate-500">Tapez une idée simple, par exemple “attente trop longue” ou “accueil agréable”.</p>
        </div>
        <span v-if="aiSearchResult?.engine" class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-600">{{ engineLabel(aiSearchResult.engine) }}</span>
      </div>

      <form class="flex flex-col gap-3 sm:flex-row" @submit.prevent="runAiSearch(1)">
        <input v-model="aiSearchQuery" placeholder="Ex: clients mécontents du temps d'attente" class="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 font-bold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
        <button class="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-black text-white disabled:cursor-wait disabled:opacity-70" :disabled="aiLoading">
          <Search :size="17" />
          Rechercher
        </button>
      </form>

      <div v-if="aiSearchResult" class="mt-5 grid gap-3">
        <button v-for="review in aiSearchResult.reviews" :key="review._id" class="rounded-2xl bg-slate-50 p-4 text-left transition hover:ring-2 hover:ring-brand-100" @click="selectedReview = review">
          <span class="mb-2 block text-sm font-black text-brand-700">{{ review.rating }}/5 - {{ new Date(review.createdAt).toLocaleString('fr-FR') }}</span>
          <p class="line-clamp-3 font-semibold text-slate-700">{{ review.serviceFeedback || 'Aucun commentaire principal.' }}</p>
        </button>
        <BasePagination v-if="aiSearchResult.pagination.totalPages > 1" :pagination="aiSearchResult.pagination" :page="aiSearchPage" label="avis similaires" @page-change="goAiSearchPage" />
        <p v-if="!aiSearchResult.reviews.length" class="rounded-xl bg-slate-50 p-4 font-bold text-slate-500">Aucun avis similaire trouvé.</p>
      </div>
    </section>

    <div v-if="selectedReview" class="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" @click.self="selectedReview = null">
      <div class="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
        <button class="float-right rounded-xl bg-slate-100 px-3 py-2 font-black" @click="selectedReview = null">Fermer</button>
        <h2 class="text-2xl font-black text-ink">Détail de l'avis</h2>
        <p class="mt-2 font-black text-brand-700">{{ selectedReview.rating }}/5</p>
        <p class="mt-4 whitespace-pre-line font-semibold text-slate-700">{{ selectedReview.serviceFeedback || '-' }}</p>
      </div>
    </div>
  </section>
</template>
