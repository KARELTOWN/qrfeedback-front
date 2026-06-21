<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Activity, AlertOctagon, BarChart3, LineChart, MessageSquareText, MousePointerClick, ShieldCheck, Star, Target, TrendingDown, TrendingUp } from 'lucide-vue-next';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useDashboard, type DashboardStats, type MonthlyEvolution, type QrTrend, type RatingDistribution } from '../../composables/useDashboard';

const { getStats, getMonthlyEvolution, getRatingDistribution, getQrTrends, updateRatingGoal } = useDashboard();
const stats = ref<DashboardStats | null>(null);
const monthlyEvolution = ref<MonthlyEvolution[]>([]);
const ratingDistribution = ref<RatingDistribution>([]);
const qrTrends = ref<QrTrend[]>([]);
const trendWeeks = ref<4 | 6 | 8>(4);
const hoveredTrendPoint = ref<{ qrCodeId: string; index: number } | null>(null);
const selectedYear = ref<number>(new Date().getFullYear());
const comparisonYear = ref(new Date().getFullYear() - 1);
const ratingFilter = ref<{ dateRange: string[] | null }>({ dateRange: currentMonthRange() });
const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const ratingGoalInput = ref(4.5);
const ratingGoalSaving = ref(false);
const UNDERPERFORMING_RATING_THRESHOLD = 2.5;
const UNDERPERFORMING_NEGATIVE_RATE_THRESHOLD = 50;

const availableYears = computed(() => {
  const current = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, index) => current - index);
});
const maxMonthlyCount = computed(() => Math.max(1, ...monthlyEvolution.value.flatMap((serie) => serie.months.map((month) => month.count))));
const maxRatingCount = computed(() => Math.max(1, ...ratingDistribution.value.map((item) => item.count)));
const totalRatingCount = computed(() => Math.max(1, ratingDistribution.value.reduce((sum, item) => sum + item.count, 0)));
const monthlyAxisTicks = computed(() => {
  const max = maxMonthlyCount.value;
  const middle = Math.ceil(max / 2);
  return [{ value: max, y: monthlyY(max) }, { value: middle, y: monthlyY(middle) }, { value: 0, y: monthlyY(0) }];
});
const sortedQrTrends = computed(() => [...qrTrends.value].sort((a, b) => b.stats.reviews - a.stats.reviews));
const conversionHealth = computed(() => {
  const rate = stats.value?.conversionRate ?? 0;
  if (!stats.value?.scanCount) return { label: 'Pas encore de scans', className: 'bg-slate-100 text-slate-600' };
  if (rate >= 10 && rate <= 30) return { label: 'Plage saine (10-30%)', className: 'bg-emerald-50 text-emerald-700' };
  if (rate > 30) return { label: 'Au-dessus de la plage habituelle', className: 'bg-amber-50 text-amber-700' };
  return { label: 'En dessous de la plage habituelle', className: 'bg-amber-50 text-amber-700' };
});
const ratingGoalProgress = computed(() => {
  const goal = stats.value?.ratingGoal || 4.5;
  return Math.min(100, Math.round(((stats.value?.averageRating || 0) / goal) * 100));
});
const ratingGoalReached = computed(() => (stats.value?.averageRating || 0) >= (stats.value?.ratingGoal || 4.5));
const ratingGoalGap = computed(() => Number(Math.max(0, (stats.value?.ratingGoal || 4.5) - (stats.value?.averageRating || 0)).toFixed(2)));
const ratingGoalDirty = computed(() => Math.abs(ratingGoalInput.value - (stats.value?.ratingGoal || 4.5)) > 0.001);

function monthlyX(index: number) { return 54 + index * 62; }
function monthlyY(count: number) { return 190 - (count / maxMonthlyCount.value) * 150; }
function serieColor(index: number) { return index === 0 ? '#0f766e' : '#f59e0b'; }
function serieHasData(serie: MonthlyEvolution) { return serie.months.some((month) => month.count > 0); }
function linePoints(serie: MonthlyEvolution) { return serie.months.map((month, index) => `${monthlyX(index)},${monthlyY(month.count)}`).join(' '); }
function areaPoints(serie: MonthlyEvolution) { return `${monthlyX(0)},190 ${linePoints(serie)} ${monthlyX(11)},190`; }
function ratingTierClass(rating: number) {
  if (rating <= 2) return 'bg-rose-500';
  if (rating === 3) return 'bg-amber-500';
  return 'bg-brand-700';
}
function ratingPercent(count: number) { return Math.round((count / totalRatingCount.value) * 100); }

function isUnderperformingQr(item: QrTrend) {
  return item.stats.reviews > 0 && (item.currentRating <= UNDERPERFORMING_RATING_THRESHOLD || item.negativeRate >= UNDERPERFORMING_NEGATIVE_RATE_THRESHOLD);
}

async function saveRatingGoal() {
  if (ratingGoalInput.value < 1 || ratingGoalInput.value > 5) return;
  ratingGoalSaving.value = true;
  try {
    const result = await updateRatingGoal(ratingGoalInput.value);
    if (stats.value) stats.value.ratingGoal = result.ratingGoal;
    ratingGoalInput.value = result.ratingGoal;
  } finally {
    ratingGoalSaving.value = false;
  }
}

function currentMonthRange() {
  const now = new Date();
  return [formatDateString(new Date(now.getFullYear(), now.getMonth(), 1)), formatDateString(new Date(now.getFullYear(), now.getMonth() + 1, 0))];
}
function formatDateString(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function formatFilterDate(value?: string) {
  if (!value) return undefined;
  return value;
}
function formatPercent(value?: number) {
  return Math.min(Math.max(Number(value || 0), 0), 100);
}

// ─── Sparkline : source de vérité unique ───────────────────────────────────
function sparklineCoords(item: QrTrend, index: number, rating: number) {
  const len = Math.max(1, item.sparkline.length - 1);
  return {
    x: 8 + index * (184 / len),
    y: 70 - (Math.min(rating, 5) / 5) * 58,
  };
}

function trendPoints(item: QrTrend) {
  return item.sparkline
    .map((point, index) => {
      const { x, y } = sparklineCoords(item, index, point.averageRating ?? 0);
      return `${x},${y}`;
    })
    .join(' ');
}

function trendPointX(item: QrTrend, index: number) {
  return sparklineCoords(item, index, 0).x;
}

function trendPointY(item: QrTrend, index: number) {
  const point = item.sparkline[index];
  return sparklineCoords(item, index, point?.averageRating ?? 0).y;
}

function trendBadge(item: QrTrend) { return item.trend.direction === 'up' ? 'Hausse' : item.trend.direction === 'down' ? 'Baisse' : 'Stable'; }
function trendColor(item: QrTrend) { return item.trend.direction === 'up' ? '#059669' : item.trend.direction === 'down' ? '#e11d48' : '#64748b'; }

// ─── Chargement des données ─────────────────────────────────────────────────
async function loadMonthlyEvolution() {
  const years = Array.from(new Set([selectedYear.value, comparisonYear.value]));
  monthlyEvolution.value = await getMonthlyEvolution(years);
}

async function loadRatingDistribution() {
  const range = ratingFilter.value.dateRange || [];
  ratingDistribution.value = await getRatingDistribution(formatFilterDate(range[0]), formatFilterDate(range[1]));
}

async function loadQrTrends() {
  qrTrends.value = (await getQrTrends(trendWeeks.value)).items;
}

async function applyRatingDateRange() {
  const range = ratingFilter.value.dateRange || [];
  if (!range[0] && !range[1]) ratingFilter.value.dateRange = currentMonthRange();
  if (!range[0] || !range[1]) return;
  await loadRatingDistribution();
}

async function load() {
  const statsPromise = getStats();
  await Promise.all([loadMonthlyEvolution(), loadRatingDistribution(), loadQrTrends()]);
  stats.value = await statsPromise;
  ratingGoalInput.value = stats.value.ratingGoal;
}

// ─── Watchers ───────────────────────────────────────────────────────────────
watch([selectedYear, comparisonYear], loadMonthlyEvolution);

// Réinitialise le tooltip avant de recharger pour éviter un index obsolète
watch(trendWeeks, async () => {
  hoveredTrendPoint.value = null;
  await loadQrTrends();
});

onMounted(load);
</script>

<template>
  <section class="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <p class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-black text-brand-700">
      <ShieldCheck :size="16" />
      Tableau de bord
    </p>
    <h2 class="mt-3 text-3xl font-black text-ink">Performance des avis</h2>
    <p class="mt-2 max-w-2xl font-semibold leading-7 text-slate-600">Suivez les avis collectés, la satisfaction moyenne
      et la conversion entre scans et avis soumis.</p>
  </section>

  <section class="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span class="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-700">
        <MessageSquareText :size="22" />
      </span>
      <p class="mt-4 font-bold text-slate-600">Avis</p>
      <strong class="mt-2 block text-4xl font-black text-ink">{{ stats?.count || 0 }}</strong>
    </article>
    <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span class="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
        <Star :size="22" />
      </span>
      <p class="mt-4 font-bold text-slate-600">Note moyenne</p>
      <strong class="mt-2 block text-4xl font-black text-ink">{{ stats?.averageRating || 0 }}/5</strong>
    </article>
    <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <span class="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-700">
        <MousePointerClick :size="22" />
      </span>
      <p class="mt-4 font-bold text-slate-600">Conversion scan → avis</p>
      <strong class="mt-2 block text-4xl font-black text-ink">{{ formatPercent(stats?.conversionRate) }}%</strong>
      <span class="mt-2 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black" :class="conversionHealth.className">{{ conversionHealth.label }}</span>
      <span class="mt-1 block text-sm font-black text-slate-500">{{ stats?.scanCount || 0 }} scans</span>
    </article>
    <article class="rounded-2xl border border-slate-200 bg-emerald-50 p-6 shadow-sm">
      <span class="grid h-12 w-12 place-items-center rounded-2xl bg-white text-emerald-700">
        <ShieldCheck :size="22" />
      </span>
      <p class="mt-4 font-bold text-emerald-900">Accès</p>
      <strong class="mt-2 block text-4xl font-black text-emerald-950">Gratuit</strong>
    </article>
  </section>

  <section class="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex items-start gap-3">
        <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"><Target :size="22" /></span>
        <div>
          <h2 class="text-xl font-black text-ink">Objectif de note</h2>
          <p class="mt-1 font-semibold text-slate-500">Définissez votre propre objectif et suivez votre progression.</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <input v-model.number="ratingGoalInput" type="number" min="1" max="5" step="0.1" class="h-10 w-20 rounded-xl border border-slate-300 px-3 text-center font-black text-ink outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
        <button class="h-10 rounded-xl bg-brand-700 px-4 font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50" :disabled="!ratingGoalDirty || ratingGoalSaving" @click="saveRatingGoal">
          {{ ratingGoalSaving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </div>
    <div class="mt-5">
      <div class="flex items-center justify-between text-sm font-bold text-slate-600">
        <span>{{ stats?.averageRating || 0 }}/5 actuel</span>
        <span>Objectif : {{ stats?.ratingGoal || 4.5 }}/5</span>
      </div>
      <div class="mt-2 h-4 overflow-hidden rounded-full bg-slate-100">
        <div class="h-4 rounded-full transition-all" :class="ratingGoalReached ? 'bg-emerald-600' : 'bg-brand-700'" :style="{ width: `${ratingGoalProgress}%` }"></div>
      </div>
      <p class="mt-2 text-sm font-bold" :class="ratingGoalReached ? 'text-emerald-700' : 'text-slate-500'">
        {{ ratingGoalReached ? 'Objectif atteint !' : `Encore ${ratingGoalGap} point(s) pour atteindre l'objectif.` }}
      </p>
    </div>
  </section>

  <section class="mb-8 grid gap-6">

    <!-- Évolution des notes par QR code -->
    <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-start gap-3">
          <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700"><Activity :size="22" /></span>
          <div>
            <h2 class="text-xl font-black text-ink">Évolution des notes — par QR code</h2>
            <p class="mt-1 font-semibold text-slate-500">La tendance compare la première et la seconde moitié de la
              période. Les QR codes les plus actifs sont affichés en premier.</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button v-for="weeks in [4, 6, 8] as const" :key="weeks" class="rounded-lg px-3 py-2 text-sm font-black"
            :class="trendWeeks === weeks ? 'bg-ink text-white' : 'bg-slate-100 text-slate-700'"
            @click="trendWeeks = weeks">
            {{ weeks }} sem.
          </button>
        </div>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="item in sortedQrTrends" :key="item.qrCodeId"
          class="rounded-2xl border p-4"
          :class="isUnderperformingQr(item) ? 'border-rose-300 bg-rose-50 ring-1 ring-rose-200' : 'border-slate-200 bg-slate-50'">
          <div v-if="isUnderperformingQr(item)" class="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-black text-white">
            <AlertOctagon :size="14" />
            QR sous-performant · {{ item.negativeRate }}% d'avis négatifs
          </div>
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-black text-ink">{{ item.label }}</p>
              <strong class="text-2xl font-black" :class="item.stats.reviews ? 'text-ink' : 'text-slate-400'">{{ item.stats.reviews ? `${item.currentRating}/5` : '—' }}</strong>
            </div>
            <span v-if="item.stats.reviews" class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-black"
              :class="item.trend.direction === 'up' ? 'bg-emerald-100 text-emerald-700' : item.trend.direction === 'down' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-700'">
              <TrendingUp v-if="item.trend.direction === 'up'" :size="13" />
              <TrendingDown v-else-if="item.trend.direction === 'down'" :size="13" />
              {{ trendBadge(item) }}
            </span>
            <span v-else class="inline-flex items-center rounded-full bg-slate-200 px-2 py-1 text-xs font-black text-slate-500">Pas d'avis</span>
          </div>

          <div v-if="item.stats.reviews" class="relative mt-3">
            <svg viewBox="0 0 200 80" class="h-24 w-full overflow-visible">
              <polyline :points="trendPoints(item)" fill="none" :stroke="trendColor(item)" stroke-width="3"
                stroke-linecap="round" stroke-linejoin="round" />
              <circle v-for="(point, index) in item.sparkline" :key="point.start" :cx="trendPointX(item, index)"
                :cy="trendPointY(item, index)" r="5" :fill="trendColor(item)" class="cursor-pointer"
                @mouseenter="hoveredTrendPoint = { qrCodeId: item.qrCodeId, index }"
                @mouseleave="hoveredTrendPoint = null" />
            </svg>
            <div v-if="hoveredTrendPoint?.qrCodeId === item.qrCodeId && item.sparkline[hoveredTrendPoint.index]"
              class="absolute right-0 top-0 rounded-lg bg-ink px-2 py-1 text-xs font-bold text-white">
              {{ item.sparkline[hoveredTrendPoint.index]?.averageRating ?? '—' }}/5 · {{
                item.sparkline[hoveredTrendPoint.index]?.count || 0 }} avis
            </div>
          </div>
          <div v-else class="mt-3 grid h-24 place-items-center rounded-xl bg-slate-100/70 text-sm font-bold text-slate-400">
            Pas encore d'avis sur la période
          </div>

          <p class="mt-2 text-xs font-bold text-slate-500">
            Min {{ item.stats.min }} · Max {{ item.stats.max }} · Moy. {{ item.stats.average }} · {{ item.stats.scans }}
            scans
          </p>
        </article>
      </div>
    </div>

    <!-- Évolution mensuelle -->
    <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-start gap-3">
          <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700"><LineChart :size="22" /></span>
          <h2 class="text-xl font-black text-ink">Évolution mensuelle des avis</h2>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <select v-model.number="selectedYear" class="h-10 rounded-xl border border-slate-300 px-3 font-bold">
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
          </select>
          <span class="text-sm font-bold text-slate-600">Comparer avec</span>
          <select v-model.number="comparisonYear" class="h-10 rounded-xl border border-slate-300 px-3 font-bold">
            <option v-for="year in availableYears" :key="`compare-${year}`" :value="year">{{ year }}</option>
          </select>
        </div>
      </div>
      <svg viewBox="0 0 780 230" class="h-80 w-full overflow-visible lg:h-[420px]">
        <g class="text-slate-300">
          <line x1="48" y1="190" x2="750" y2="190" stroke="currentColor" />
          <line x1="48" y1="40" x2="48" y2="190" stroke="currentColor" />
          <g v-for="tick in monthlyAxisTicks" :key="tick.value">
            <line x1="44" :y1="tick.y" x2="750" :y2="tick.y" stroke="currentColor" stroke-dasharray="4 8"
              opacity="0.45" />
            <text x="18" :y="tick.y + 4" class="fill-slate-500 text-xs font-bold">{{ tick.value }}</text>
          </g>
        </g>
        <polygon v-if="monthlyEvolution[0] && serieHasData(monthlyEvolution[0])" :points="areaPoints(monthlyEvolution[0])" :fill="serieColor(0)" fill-opacity="0.08" stroke="none" />
        <polyline v-for="(serie, index) in monthlyEvolution" :key="serie.year" :points="linePoints(serie)" fill="none"
          :stroke="serieColor(index)" :stroke-width="serieHasData(serie) ? 4 : 2"
          :stroke-dasharray="serieHasData(serie) ? undefined : '6 6'" :opacity="serieHasData(serie) ? 1 : 0.5"
          stroke-linecap="round" stroke-linejoin="round" />
        <g v-for="(serie, serieIndex) in monthlyEvolution" :key="`points-${serie.year}`">
          <template v-if="serieHasData(serie)">
            <g v-for="(month, index) in serie.months" :key="`${serie.year}-${month.month}`">
              <circle :cx="monthlyX(index)" :cy="monthlyY(month.count)" r="5" :fill="serieColor(serieIndex)" />
              <text v-if="month.count > 0" :x="monthlyX(index)" :y="monthlyY(month.count) - 12" text-anchor="middle"
                class="fill-ink text-xs font-black">{{ month.count }}</text>
            </g>
          </template>
        </g>
        <text v-for="(label, index) in monthLabels" :key="label" :x="monthlyX(index) - 12" y="218"
          class="fill-slate-500 text-xs font-bold">{{ label }}</text>
      </svg>
      <div class="mt-2 flex flex-wrap gap-4 text-sm font-black">
        <span v-for="(serie, index) in monthlyEvolution" :key="serie.year"
          class="inline-flex items-center gap-2" :class="index === 0 ? 'text-brand-700' : 'text-amber-600'">
          <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: serieColor(index) }"></span>
          {{ serie.year }}
          <span v-if="!serieHasData(serie)" class="font-bold text-slate-400">(aucune donnée)</span>
        </span>
      </div>
    </div>

    <!-- Avis par notation -->
    <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-start gap-3">
          <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600"><BarChart3 :size="22" /></span>
          <h2 class="text-xl font-black text-ink">Avis par notation</h2>
        </div>
        <div class="min-w-[280px] sm:w-[420px]">
          <VueDatePicker v-model="ratingFilter.dateRange" range multi-calendars model-type="yyyy-MM-dd"
            :formats="{ input: 'dd/MM/yyyy', preview: 'dd/MM/yyyy' }" placeholder="Sélectionner une période"
            :enable-time-picker="false" :clearable="false" auto-apply teleport-center
            @update:model-value="applyRatingDateRange" />
        </div>
      </div>
      <div class="grid gap-4">
        <div v-for="item in [...ratingDistribution].reverse()" :key="item.rating"
          class="grid grid-cols-[90px_1fr_90px] items-center gap-3">
          <span class="inline-flex items-center gap-1 font-black text-ink">
            <Star :size="14" class="fill-amber-400 text-amber-400" /> {{ item.rating }} étoile{{ item.rating > 1 ? 's' : '' }}
          </span>
          <div class="h-5 overflow-hidden rounded-full bg-slate-100">
            <div class="h-5 rounded-full transition-all" :class="ratingTierClass(item.rating)" :style="{ width: `${(item.count / maxRatingCount) * 100}%` }">
            </div>
          </div>
          <span class="text-right font-black text-ink">{{ item.count }} <span class="font-bold text-slate-400">· {{ ratingPercent(item.count) }}%</span></span>
        </div>
      </div>
    </div>

  </section>
</template>