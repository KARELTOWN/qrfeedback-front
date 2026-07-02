<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AlertTriangle, BarChart3, BrainCircuit, Download, GitCompare, PieChart, RefreshCw, Search, TrendingUp } from 'lucide-vue-next';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import BasePagination from '../../components/shared/BasePagination.vue';
import AiRecommendationCard from '../../components/user/AiRecommendationCard.vue';
import { useDashboard, type AiAnalysis, type AiProblemCluster, type AiSearchResult, type CompanyQrCode, type Review } from '../../composables/useDashboard';

const { analyse, getRecommendations, getQrCodes, searchAiReviews, getReviewsForTopic, reindexAiReviews, exportAiAnalysisPdf } = useDashboard();
const route = useRoute();
const router = useRouter();
const aiOverview = ref<AiAnalysis | null>(null);
const aiSearchResult = ref<AiSearchResult | null>(null);
const aiSearchQuery = ref('');
const aiSearchPage = ref(1);
const aiMessage = ref('');
const aiLoading = ref(false);
const pdfExportLoading = ref(false);
const recommendationsLoading = ref(false);
const recommendationItems = ref<Array<{ priority: 'high' | 'medium' | 'low'; title: string; action: string; reason: string }>>([]);
const recommendationQuota = ref<{ remaining: number; resetAt: string } | null>(null);
const selectedReview = ref<Review | null>(null);
const aiDateRange = ref<string[] | null>(null);
const comparisonDateRange = ref<string[] | null>(null);
const qrCodes = ref<CompanyQrCode[]>([]);
const selectedQrCodeId = ref('');
const searchSection = ref<HTMLElement | null>(null);
const activeTopicKey = ref<string | null>(null);
const activeTopicLabel = ref('');
const LOW_SAMPLE_THRESHOLD = 3;

const donutRadius = 64;
const donutCircumference = 2 * Math.PI * donutRadius;
const sentimentColors: Record<string, string> = { positive: '#059669', neutral: '#f59e0b', negative: '#e11d48' };

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
const topProblems = computed(() => aiOverview.value?.problems || []);
const maxTopicCount = computed(() => Math.max(1, ...topProblems.value.map((problem) => problem.count)));

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

const donutSegments = computed(() => {
  let offset = 0;
  return sentimentBars.value.map((item) => {
    const length = (item.percent / 100) * donutCircumference;
    const segment = { key: item.key, color: sentimentColors[item.key], length, offset };
    offset += length;
    return segment;
  });
});

const hoveredSentimentBucket = ref<number | null>(null);

const sentimentTrendBars = computed(() => {
  const trend = aiOverview.value?.sentimentTrend || [];
  if (!trend.length) return [];
  const chartWidth = 480;
  const gap = 10;
  const slot = chartWidth / trend.length;
  const barWidth = Math.max(18, slot - gap);
  const maxBarHeight = 70;
  return trend.map((bucket, index) => {
    const positiveHeight = (bucket.positiveRate / 100) * maxBarHeight;
    const neutralHeight = (bucket.neutralRate / 100) * maxBarHeight;
    const negativeHeight = (bucket.negativeRate / 100) * maxBarHeight;
    return {
      key: bucket.startDate,
      x: index * slot + gap / 2,
      width: barWidth,
      count: bucket.count,
      positiveRate: bucket.positiveRate,
      neutralRate: bucket.neutralRate,
      negativeRate: bucket.negativeRate,
      rangeLabel: `${formatDate(bucket.startDate)} - ${formatDate(bucket.endDate)}`,
      startLabel: formatShortDateWithYear(bucket.startDate),
      endLabel: formatShortDateWithYear(bucket.endDate),
      positive: { y: 80 - positiveHeight, height: positiveHeight },
      neutral: { y: 80 - positiveHeight - neutralHeight, height: neutralHeight },
      negative: { y: 80 - positiveHeight - neutralHeight - negativeHeight, height: negativeHeight }
    };
  });
});

const currentPeriodLabel = computed(() => {
  const period = aiOverview.value?.period;
  if (period?.startDate && period?.endDate) return `${formatDate(period.startDate)} - ${formatDate(period.endDate)}`;
  const range = aiDateRange.value || [];
  if (range[0] && range[1]) return `${formatDisplayDate(range[0])} - ${formatDisplayDate(range[1])}`;
  return 'Période en cours';
});

const previousPeriodLabel = computed(() => {
  const comparison = aiOverview.value?.comparisonPeriod;
  if (comparison?.startDate && comparison?.endDate) return `${formatDate(comparison.startDate)} - ${formatDate(comparison.endDate)}`;
  return 'période précédente';
});

const comparisonMetrics = computed(() => {
  const overview = aiOverview.value;
  if (!overview) return [];
  const reviewsMax = Math.max(overview.reviews.count, overview.comparison.previousReviewCount, 1);
  return [
    {
      key: 'reviews',
      label: 'Avis collectés',
      currentValue: overview.reviews.count,
      previousValue: overview.comparison.previousReviewCount,
      currentPercent: (overview.reviews.count / reviewsMax) * 100,
      previousPercent: (overview.comparison.previousReviewCount / reviewsMax) * 100,
      format: (value: number) => String(value)
    },
    {
      key: 'rating',
      label: 'Note moyenne',
      currentValue: overview.reviews.averageRating,
      previousValue: overview.comparison.previousAverageRating,
      currentPercent: (overview.reviews.averageRating / 5) * 100,
      previousPercent: (overview.comparison.previousAverageRating / 5) * 100,
      format: (value: number) => `${value}/5`
    },
    {
      key: 'conversion',
      label: 'Conversion scan → avis',
      currentValue: overview.scans.conversionRate,
      previousValue: overview.comparison.previousConversionRate,
      currentPercent: overview.scans.conversionRate,
      previousPercent: overview.comparison.previousConversionRate,
      format: (value: number) => `${value}%`
    }
  ];
});

const aiTrendsText = computed(() => cleanText(aiOverview.value?.trends.text) || 'Aucune tendance disponible pour le moment.');

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
    .replace(/Ã /g, 'à')
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
    .replace(/â€/g, '"');
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

function impactBarClass(impact: string) {
  if (impact === 'high') return 'bg-rose-500';
  if (impact === 'medium') return 'bg-amber-500';
  return 'bg-slate-400';
}

function topicBarPercent(problem: AiProblemCluster) {
  return Math.round((problem.count / maxTopicCount.value) * 100);
}

function isLowSample(problem: AiProblemCluster) {
  return problem.count < LOW_SAMPLE_THRESHOLD;
}

function formatShortDateWithYear(value: string) {
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
}

function engineLabel(engine?: string) {
  if (engine === 'typesense') return 'Recherche IA';
  if (engine === 'mongo-fallback') return 'Recherche simple';
  if (engine === 'topic') return 'Avis du sujet';
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

function lastDaysRange(days: number) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return [formatDateString(start), formatDateString(now)];
}

function lastMonthRange() {
  const now = new Date();
  return [formatDateString(new Date(now.getFullYear(), now.getMonth() - 1, 1)), formatDateString(new Date(now.getFullYear(), now.getMonth(), 0))];
}

async function applyDatePreset(preset: '7d' | '30d' | 'month' | 'lastMonth') {
  if (preset === '7d') aiDateRange.value = lastDaysRange(7);
  else if (preset === '30d') aiDateRange.value = lastDaysRange(30);
  else if (preset === 'month') aiDateRange.value = currentMonthRange();
  else aiDateRange.value = lastMonthRange();
  await applyDateRange();
}

function groupX(index: number) {
  return 40 + index * 180;
}

function barHeight(percent: number) {
  return (Math.min(100, Math.max(0, percent)) / 100) * 140;
}

function barY(percent: number) {
  return 180 - barHeight(percent);
}

function metricDelta(metric: { currentValue: number; previousValue: number }) {
  const delta = Number((metric.currentValue - metric.previousValue).toFixed(2));
  if (delta > 0) return { text: `▲ +${delta}`, class: 'text-emerald-700' };
  if (delta < 0) return { text: `▼ ${delta}`, class: 'text-rose-700' };
  return { text: 'Stable', class: 'text-slate-500' };
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

async function applyComparisonRange() {
  await syncRangeToUrl();
  await loadAiOverview();
}

async function loadQrCodes() {
  const result = await getQrCodes(1, 100);
  qrCodes.value = result.qrCodes;
}

async function loadAiOverview() {
  aiOverview.value = await analyse(getRangeQuery());
}

async function loadRecommendations() {
  if (!aiOverview.value) return;
  recommendationsLoading.value = true;
  aiMessage.value = '';
  try {
    const result = await getRecommendations(getRangeQuery());
    recommendationItems.value = result.recommendations;
    recommendationQuota.value = result.quota || null;
  } catch (error) {
    aiMessage.value = error instanceof Error ? error.message : 'Impossible de générer les recommandations.';
  } finally {
    recommendationsLoading.value = false;
  }
}

async function runAiSearch(page = 1) {
  activeTopicKey.value = null;
  activeTopicLabel.value = '';
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

async function runTopicSearch(page = 1) {
  if (!activeTopicKey.value) return;
  aiLoading.value = true;
  aiSearchPage.value = page;
  try {
    aiSearchResult.value = await getReviewsForTopic(activeTopicKey.value, getRangeQuery(), page, 10);
  } finally {
    aiLoading.value = false;
  }
}

async function goAiSearchPage(page: number) {
  if (activeTopicKey.value) await runTopicSearch(page);
  else await runAiSearch(page);
}

async function pivotToTopic(problem: AiProblemCluster) {
  aiSearchQuery.value = '';
  activeTopicKey.value = problem.key;
  activeTopicLabel.value = cleanText(problem.label);
  await runTopicSearch(1);
  searchSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function downloadAiAnalysisPdf() {
  aiMessage.value = '';
  pdfExportLoading.value = true;
  try {
    const blob = await exportAiAnalysisPdf({
      ...getRangeQuery(),
      recommendations: recommendationItems.value.length ? recommendationItems.value : undefined
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'analyse-ia.pdf';
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    aiMessage.value = error instanceof Error ? error.message : 'Impossible de générer le PDF.';
  } finally {
    pdfExportLoading.value = false;
  }
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
          <div class="flex shrink-0 gap-2">
            <button class="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 font-black text-white transition hover:bg-black disabled:cursor-wait disabled:opacity-70" :disabled="aiLoading" @click="rebuildAiIndex">
              <RefreshCw :size="17" :class="{ 'animate-spin': aiLoading }" />
              Actualiser
            </button>
          </div>
            <button class="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 font-black text-ink transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-70" :disabled="pdfExportLoading || !aiOverview" @click="downloadAiAnalysisPdf">
              <Download :size="17" :class="{ 'animate-pulse': pdfExportLoading }" />
              PDF
            </button>
        </div>
      </div>
      <div class="mt-4 flex flex-wrap items-center gap-2">
        <span class="text-sm font-black text-slate-500">Raccourcis :</span>
        <button class="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200" @click="applyDatePreset('7d')">7 jours</button>
        <button class="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200" @click="applyDatePreset('30d')">30 jours</button>
        <button class="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200" @click="applyDatePreset('month')">Ce mois</button>
        <button class="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200" @click="applyDatePreset('lastMonth')">Mois dernier</button>
      </div>
      <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <span class="text-sm font-black text-slate-500">Comparer à une période spécifique :</span>
        <VueDatePicker v-model="comparisonDateRange" :max-date="new Date()" range multi-calendars model-type="yyyy-MM-dd" :formats="{ input: 'dd/MM/yyyy', preview: 'dd/MM/yyyy' }" placeholder="Choisir une période B (sinon calculée automatiquement)" :enable-time-picker="false" auto-apply teleport-center class="sm:w-[340px]" @update:model-value="applyComparisonRange" @cleared="applyComparisonRange" />
      </div>
      <p v-if="aiMessage" class="mt-4 rounded-xl bg-slate-100 px-4 py-3 font-bold text-slate-700">{{ aiMessage }}</p>
    </header>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p class="text-sm font-black uppercase text-slate-500">Avis analysés</p>
        <strong class="mt-2 block text-3xl font-black text-ink">{{ totalReviews }}</strong>
        <span class="mt-1 block text-sm font-bold text-slate-500">{{ currentPeriodLabel }}</span>
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

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div class="flex items-start gap-3">
          <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-700"><GitCompare :size="22" /></span>
          <div>
            <h3 class="text-xl font-black text-ink">Comparaison de périodes</h3>
            <p class="mt-1 font-semibold text-slate-500">Période A (en cours) contre Période B, sur les mêmes indicateurs.</p>
          </div>
        </div>
        <span class="rounded-full px-3 py-1 text-xs font-black uppercase" :class="aiOverview?.comparisonPeriod?.isCustom ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'">
          {{ aiOverview?.comparisonPeriod?.isCustom ? 'Comparaison personnalisée' : 'Période équivalente précédente' }}
        </span>
      </div>

      <div class="mb-6 grid gap-3 sm:grid-cols-2">
        <div class="rounded-2xl border border-brand-100 bg-brand-50 px-4 py-3">
          <p class="text-xs font-black uppercase text-brand-700">Période A</p>
          <p class="mt-1 font-bold text-ink">{{ currentPeriodLabel }}</p>
        </div>
        <div class="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
          <p class="text-xs font-black uppercase text-amber-700">Période B</p>
          <p class="mt-1 font-bold text-ink">{{ previousPeriodLabel }}</p>
        </div>
      </div>

      <svg v-if="comparisonMetrics.length" viewBox="0 0 600 220" class="h-56 w-full overflow-visible">
        <line x1="20" y1="180" x2="580" y2="180" stroke="#e2e8f0" />
        <g v-for="(metric, index) in comparisonMetrics" :key="metric.key">
          <rect :x="groupX(index)" :y="barY(metric.currentPercent)" width="50" :height="barHeight(metric.currentPercent)" rx="6" fill="#0f766e" />
          <rect :x="groupX(index) + 60" :y="barY(metric.previousPercent)" width="50" :height="barHeight(metric.previousPercent)" rx="6" fill="#f59e0b" />
          <text :x="groupX(index) + 25" :y="barY(metric.currentPercent) - 8" text-anchor="middle" class="fill-ink text-xs font-black">{{ metric.format(metric.currentValue) }}</text>
          <text :x="groupX(index) + 85" :y="barY(metric.previousPercent) - 8" text-anchor="middle" class="fill-ink text-xs font-black">{{ metric.format(metric.previousValue) }}</text>
          <text :x="groupX(index) + 55" y="202" text-anchor="middle" class="fill-slate-500 text-xs font-bold">{{ metric.label }}</text>
        </g>
      </svg>

      <div class="mt-2 flex flex-wrap items-center gap-4 text-sm font-black">
        <span class="inline-flex items-center gap-2 text-brand-700"><span class="h-3 w-3 rounded-full bg-brand-700"></span>Période A</span>
        <span class="inline-flex items-center gap-2 text-amber-600"><span class="h-3 w-3 rounded-full bg-amber-500"></span>Période B</span>
      </div>

      <div class="mt-4 grid gap-2 sm:grid-cols-3">
        <div v-for="metric in comparisonMetrics" :key="`delta-${metric.key}`" class="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold" :class="metricDelta(metric).class">
          {{ metric.label }} : {{ metricDelta(metric).text }}
        </div>
      </div>
    </section>

    <section class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <AiRecommendationCard
        :recommendation="recommendation"
        :loading="recommendationsLoading"
        :disabled="!aiOverview"
        :quota="recommendationQuota"
        :items="recommendationItems"
        :trends-text="aiTrendsText"
        :period-label="currentPeriodLabel"
        @request="loadRecommendations"
      />

      <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-5 flex items-start gap-3">
          <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" :class="scoreEvolution.iconClass"><PieChart :size="22" /></span>
          <div>
            <h3 class="text-xl font-black text-ink">Sentiment des clients</h3>
            <p class="mt-1 font-semibold text-slate-500">Répartition des avis sur la période.</p>
          </div>
        </div>

        <div v-if="totalReviews">
          <div class="flex flex-col items-center gap-5 sm:flex-row">
            <svg viewBox="0 0 160 160" class="h-40 w-40 shrink-0">
              <g transform="translate(80,80) rotate(-90)">
                <circle r="64" fill="none" stroke="#e2e8f0" stroke-width="22" />
                <circle
                  v-for="segment in donutSegments"
                  :key="segment.key"
                  r="64"
                  fill="none"
                  :stroke="segment.color"
                  stroke-width="22"
                  :stroke-dasharray="`${segment.length} ${donutCircumference - segment.length}`"
                  :stroke-dashoffset="-segment.offset"
                />
              </g>
              <text x="80" y="76" text-anchor="middle" class="fill-ink text-2xl font-black">{{ totalReviews }}</text>
              <text x="80" y="96" text-anchor="middle" class="fill-slate-500 text-xs font-bold">avis</text>
            </svg>

            <div class="grid w-full gap-3">
              <div v-for="item in sentimentBars" :key="item.key" class="grid gap-1.5">
                <div class="flex items-center justify-between gap-3">
                  <span class="font-black text-ink">{{ item.label }}</span>
                  <span class="rounded-full px-3 py-1 text-sm font-black" :class="item.soft">{{ item.percent }}% · {{ item.count }}</span>
                </div>
                <div class="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div class="h-full rounded-full" :class="item.color" :style="{ width: `${item.percent}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="sentimentTrendBars.length" class="mt-6 border-t border-slate-100 pt-5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="text-xs font-black uppercase tracking-wide text-slate-500">Évolution du sentiment sur la période</p>
              <div class="flex items-center gap-3 text-xs font-bold text-slate-500">
                <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-emerald-600"></span>Positif</span>
                <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-amber-500"></span>Neutre</span>
                <span class="inline-flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-full bg-rose-600"></span>Négatif</span>
              </div>
            </div>
            <div class="relative mt-3">
              <svg viewBox="0 0 480 108" class="h-28 w-full overflow-visible">
                <line x1="0" y1="80" x2="480" y2="80" stroke="#e2e8f0" />
                <g v-for="(bar, index) in sentimentTrendBars" :key="bar.key" class="cursor-pointer" @mouseenter="hoveredSentimentBucket = index" @mouseleave="hoveredSentimentBucket = null">
                  <rect :x="bar.x - 3" y="0" :width="bar.width + 6" height="80" fill="transparent" />
                  <rect :x="bar.x" :y="bar.positive.y" :width="bar.width" :height="bar.positive.height" fill="#059669" :opacity="hoveredSentimentBucket === null || hoveredSentimentBucket === index ? 1 : 0.35" />
                  <rect :x="bar.x" :y="bar.neutral.y" :width="bar.width" :height="bar.neutral.height" fill="#f59e0b" :opacity="hoveredSentimentBucket === null || hoveredSentimentBucket === index ? 1 : 0.35" />
                  <rect :x="bar.x" :y="bar.negative.y" :width="bar.width" :height="bar.negative.height" fill="#e11d48" :opacity="hoveredSentimentBucket === null || hoveredSentimentBucket === index ? 1 : 0.35" />
                  <text :x="bar.x + bar.width / 2" y="91" text-anchor="middle" class="fill-slate-500 text-[8px] font-bold">{{ bar.startLabel }}</text>
                  <text :x="bar.x + bar.width / 2" y="101" text-anchor="middle" class="fill-slate-400 text-[8px] font-bold">{{ bar.endLabel }}</text>
                </g>
              </svg>
              <div
                v-if="hoveredSentimentBucket !== null && sentimentTrendBars[hoveredSentimentBucket]"
                class="pointer-events-none absolute top-0 -translate-y-2 rounded-lg bg-ink px-3 py-2 text-xs font-bold text-white shadow-lg"
                :style="{ left: `${Math.min(78, Math.max(0, (sentimentTrendBars[hoveredSentimentBucket].x / 480) * 100))}%` }"
              >
                <p class="font-black">{{ sentimentTrendBars[hoveredSentimentBucket].rangeLabel }} · {{ sentimentTrendBars[hoveredSentimentBucket].count }} avis</p>
                <p class="text-emerald-300">Positif {{ sentimentTrendBars[hoveredSentimentBucket].positiveRate }}%</p>
                <p class="text-amber-300">Neutre {{ sentimentTrendBars[hoveredSentimentBucket].neutralRate }}%</p>
                <p class="text-rose-300">Négatif {{ sentimentTrendBars[hoveredSentimentBucket].negativeRate }}%</p>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="rounded-2xl bg-slate-50 p-6 font-bold text-slate-500">Aucun avis sur cette période pour calculer le sentiment.</p>
      </article>
    </section>

    <section class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-700"><BarChart3 :size="22" /></span>
          <div>
            <h3 class="text-xl font-black text-ink">Sujets qui reviennent souvent</h3>
            <p class="mt-1 font-semibold text-slate-500">Les thèmes à surveiller, classés par impact et fréquence.</p>
          </div>
        </div>
        <span class="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">
          <AlertTriangle :size="15" />
          {{ topProblems.length }} sujet(s)
        </span>
      </div>

      <div v-if="topProblems.length" class="mb-6 grid gap-2.5">
        <button v-for="problem in topProblems" :key="`bar-${problem.key}`" class="grid grid-cols-[140px_1fr_44px] items-center gap-3 rounded-lg text-left transition hover:bg-slate-50 sm:grid-cols-[200px_1fr_44px]" title="Voir les avis liés à ce sujet" @click="pivotToTopic(problem)">
          <span class="truncate font-black text-ink">{{ cleanText(problem.label) }} <em v-if="isLowSample(problem)" class="text-xs font-bold not-italic text-slate-400">(échantillon faible)</em></span>
          <div class="h-3 overflow-hidden rounded-full bg-slate-100">
            <div class="h-3 rounded-full" :class="impactBarClass(problem.impact)" :style="{ width: `${topicBarPercent(problem)}%` }"></div>
          </div>
          <span class="text-right font-black text-ink">{{ problem.count }}</span>
        </button>
      </div>

      <div v-if="topProblems.length" class="grid gap-4 lg:grid-cols-2">
        <article v-for="problem in topProblems" :key="problem.key" class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div class="flex items-start justify-between gap-3">
            <div>
              <button class="text-left text-lg font-black text-ink underline-offset-2 hover:underline" title="Voir les avis liés à ce sujet" @click="pivotToTopic(problem)">{{ cleanText(problem.label) }}</button>
              <p class="mt-1 font-semibold text-slate-500">{{ problem.count }} mention(s), note moyenne {{ problem.averageRating }}/5</p>
            </div>
            <div class="flex flex-col items-end gap-1.5">
              <span class="rounded-full px-3 py-1 text-xs font-black uppercase ring-1" :class="impactClass(problem.impact)">{{ impactLabel(problem.impact) }}</span>
              <span v-if="isLowSample(problem)" class="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-black text-slate-600">Échantillon faible</span>
            </div>
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

    <section ref="searchSection" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-xl font-black text-ink">Retrouver des avis similaires</h3>
          <p class="mt-1 font-semibold text-slate-500">Tapez une idée simple, par exemple “attente trop longue” ou “accueil agréable”.</p>
        </div>
        <span v-if="aiSearchResult?.engine" class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-600">{{ engineLabel(aiSearchResult.engine) }}</span>
      </div>

      <div v-if="activeTopicKey" class="mb-3 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700">
        <span>Sujet : {{ activeTopicLabel }}</span>
        <button type="button" class="ml-auto font-black text-brand-700 underline-offset-2 hover:underline" @click="activeTopicKey = null; activeTopicLabel = ''; aiSearchResult = null;">Effacer</button>
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
