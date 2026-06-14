<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { Mail, MessageSquareText, ShieldCheck, Star } from 'lucide-vue-next';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { useDashboard, type DashboardStats, type MonthlyEvolution, type RatingDistribution } from '../../composables/useDashboard';

const { getStats, getMonthlyEvolution, getRatingDistribution } = useDashboard();
const stats = ref<DashboardStats | null>(null);
const monthlyEvolution = ref<MonthlyEvolution[]>([]);
const ratingDistribution = ref<RatingDistribution>([]);
const selectedYears = ref<number[]>([new Date().getFullYear()]);
const comparisonYear = ref(new Date().getFullYear() - 1);
const ratingFilter = ref<{ dateRange: string[] | null }>({ dateRange: currentMonthRange() });
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
  return [{ value: max, y: monthlyY(max) }, { value: middle, y: monthlyY(middle) }, { value: 0, y: monthlyY(0) }];
});

function monthlyX(index: number) { return 54 + index * 62; }
function monthlyY(count: number) { return 190 - (count / maxMonthlyCount.value) * 150; }
function serieColor(index: number) { return index === 0 ? '#0f766e' : '#f59e0b'; }
function linePoints(serie: MonthlyEvolution) { return serie.months.map((month, index) => `${monthlyX(index)},${monthlyY(month.count)}`).join(' '); }
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

async function loadMonthlyEvolution() {
  const years = Array.from(new Set([selectedYears.value[0], comparisonYear.value]));
  monthlyEvolution.value = await getMonthlyEvolution(years);
}

async function loadRatingDistribution() {
  const range = ratingFilter.value.dateRange || [];
  ratingDistribution.value = await getRatingDistribution(formatFilterDate(range[0]), formatFilterDate(range[1]));
}

async function loadCharts() {
  await loadMonthlyEvolution();
  await loadRatingDistribution();
}

async function applyRatingDateRange() {
  const range = ratingFilter.value.dateRange || [];
  if (!range[0] && !range[1]) ratingFilter.value.dateRange = currentMonthRange();
  if (!range[0] || !range[1]) return;
  await loadRatingDistribution();
}

async function load() {
  const statsPromise = getStats();
  await loadCharts();
  stats.value = await statsPromise;
}

watch([selectedYears, comparisonYear], async () => {
  await loadMonthlyEvolution();
}, { deep: true });
onMounted(load);
</script>

<template>
  <section class="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    <article class="rounded-3xl bg-sky-50 p-7"><span class="grid h-14 w-14 place-items-center rounded-full bg-black text-white"><MessageSquareText :size="24" /></span><p class="mt-4 text-lg font-bold text-black">Avis</p><strong class="mt-2 block text-4xl font-black text-black">{{ stats?.count || 0 }}</strong></article>
    <article class="rounded-3xl bg-emerald-50 p-7"><span class="grid h-14 w-14 place-items-center rounded-full bg-black text-white"><Star :size="24" /></span><p class="mt-4 text-lg font-bold text-black">Note moyenne</p><strong class="mt-2 block text-4xl font-black text-black">{{ stats?.averageRating || 0 }}/5</strong></article>
    <article class="rounded-3xl bg-violet-50 p-7"><span class="grid h-14 w-14 place-items-center rounded-full bg-black text-white"><Mail :size="24" /></span><p class="mt-4 text-lg font-bold text-black">Notifications email</p><strong class="mt-2 block text-4xl font-black text-black">Illimitees</strong></article>
    <article class="rounded-3xl bg-amber-50 p-7"><span class="grid h-14 w-14 place-items-center rounded-full bg-black text-white"><ShieldCheck :size="24" /></span><p class="mt-4 text-lg font-bold text-black">Plan</p><strong class="mt-2 block text-4xl font-black text-black">Gratuit</strong></article>
  </section>

  <section class="mb-8 grid gap-6">
    <div class="rounded-3xl border border-slate-200 p-5">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-xl font-black text-ink">Évolution mensuelle des avis</h2>
        <div class="flex flex-wrap items-center gap-2">
          <select v-model.number="selectedYears[0]" class="h-10 rounded-xl border border-slate-300 px-3 font-bold"><option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option></select>
          <span class="text-sm font-bold text-slate-600">Comparer avec</span>
          <select v-model.number="comparisonYear" class="h-10 rounded-xl border border-slate-300 px-3 font-bold"><option v-for="year in availableYears" :key="`compare-${year}`" :value="year">{{ year }}</option></select>
        </div>
      </div>
      <svg viewBox="0 0 780 230" class="h-80 w-full overflow-visible lg:h-[420px]">
        <g class="text-slate-300"><line x1="48" y1="190" x2="750" y2="190" stroke="currentColor" /><line x1="48" y1="40" x2="48" y2="190" stroke="currentColor" /><g v-for="tick in monthlyAxisTicks" :key="tick.value"><line x1="44" :y1="tick.y" x2="750" :y2="tick.y" stroke="currentColor" stroke-dasharray="4 8" opacity="0.45" /><text x="18" :y="tick.y + 4" class="fill-slate-500 text-xs font-bold">{{ tick.value }}</text></g></g>
        <polyline v-for="(serie, index) in monthlyEvolution" :key="serie.year" :points="linePoints(serie)" fill="none" :stroke="serieColor(index)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <g v-for="(serie, serieIndex) in monthlyEvolution" :key="`points-${serie.year}`"><g v-for="(month, index) in serie.months" :key="`${serie.year}-${month.month}`"><circle :cx="monthlyX(index)" :cy="monthlyY(month.count)" r="5" :fill="serieColor(serieIndex)" /><text v-if="month.count > 0" :x="monthlyX(index)" :y="monthlyY(month.count) - 12" text-anchor="middle" class="fill-ink text-xs font-black">{{ month.count }}</text></g></g>
        <text v-for="(label, index) in monthLabels" :key="label" :x="monthlyX(index) - 12" y="218" class="fill-slate-500 text-xs font-bold">{{ label }}</text>
      </svg>
      <div class="mt-2 flex gap-4 text-sm font-black"><span v-for="(serie, index) in monthlyEvolution" :key="serie.year" :class="index === 0 ? 'text-brand-700' : 'text-amber-600'">{{ serie.year }}</span></div>
    </div>

    <div class="rounded-3xl border border-slate-200 p-5">
      <div class="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 class="text-xl font-black text-ink">Avis par notation</h2><div class="min-w-[280px] sm:w-[420px]"><VueDatePicker v-model="ratingFilter.dateRange" range multi-calendars model-type="yyyy-MM-dd" :formats="{ input: 'dd/MM/yyyy', preview: 'dd/MM/yyyy' }" placeholder="Sélectionner une période" :enable-time-picker="false" :clearable="false" auto-apply teleport-center @update:model-value="applyRatingDateRange" /></div></div>
      <div class="grid gap-4"><div v-for="item in ratingDistribution" :key="item.rating" class="grid grid-cols-[70px_1fr_40px] items-center gap-3"><span class="font-black text-ink">{{ item.rating }} étoile{{ item.rating > 1 ? 's' : '' }}</span><div class="h-5 rounded-full bg-slate-100"><div class="h-5 rounded-full bg-brand-700" :style="{ width: `${(item.count / maxRatingCount) * 100}%` }"></div></div><span class="text-right font-black text-ink">{{ item.count }}</span></div></div>
    </div>
  </section>
</template>
