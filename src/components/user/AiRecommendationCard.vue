<script setup lang="ts">
import { Lightbulb, Sparkles } from 'lucide-vue-next';

export type RecommendationItem = {
  priority: 'high' | 'medium' | 'low';
  title: string;
  action: string;
  reason: string;
};

const props = withDefaults(defineProps<{
  recommendation: string;
  loading?: boolean;
  disabled?: boolean;
  quota?: { remaining: number; resetAt: string } | null;
  items?: RecommendationItem[];
  trendsText?: string;
  // Dashboard mode : sélecteur de semaines intégré
  weeks?: 4 | 6 | 8;
  // AI page mode : label de période libre (ex: "01 jan. – 31 mai 2026")
  periodLabel?: string;
}>(), {
  loading: false,
  disabled: false,
  quota: null,
  items: () => [],
  trendsText: '',
  weeks: undefined,
  periodLabel: '',
});

const emit = defineEmits<{
  request: [];
  'update:weeks': [value: 4 | 6 | 8];
}>();

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function priorityLabel(priority: RecommendationItem['priority']) {
  return priority === 'high' ? 'Priorité haute' : priority === 'medium' ? 'Priorité moyenne' : 'À consolider';
}

function priorityClass(priority: RecommendationItem['priority']) {
  return priority === 'high' ? 'bg-rose-50 text-rose-700' : priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';
}

function priorityBarClass(priority: RecommendationItem['priority']) {
  return priority === 'high' ? 'bg-rose-500' : priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500';
}
</script>

<template>
  <article class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
    <div class="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div class="flex items-start gap-3">
        <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-700 text-white">
          <Lightbulb :size="22" />
        </span>
        <div>
          <h3 class="text-xl font-black text-ink">À faire en priorité</h3>
          <p class="mt-1 font-semibold text-slate-500">La recommandation la plus utile d'après les avis sélectionnés.</p>
        </div>
      </div>

      <!-- Sélecteur de semaines (dashboard) -->
      <div v-if="props.weeks !== undefined" class="flex gap-2">
        <button
          v-for="w in ([4, 6, 8] as const)"
          :key="w"
          class="rounded-lg px-3 py-2 text-sm font-black transition"
          :class="props.weeks === w ? 'bg-ink text-white' : 'bg-slate-100 text-slate-700'"
          @click="emit('update:weeks', w)"
        >
          {{ w }} sem.
        </button>
      </div>

      <!-- Label de période libre (page IA) -->
      <span v-else-if="props.periodLabel" class="rounded-lg bg-slate-100 px-3 py-2 text-sm font-black text-slate-600">
        {{ props.periodLabel }}
      </span>
    </div>

    <div class="rounded-2xl border border-brand-100 bg-brand-50 p-4">
      <p class="text-xs font-black uppercase tracking-wide text-brand-700">Lecture rapide</p>
      <p class="mt-1 font-bold leading-6 text-brand-950">{{ recommendation }}</p>
    </div>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <button
        class="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 font-black text-white disabled:cursor-wait disabled:opacity-70"
        :disabled="props.loading || props.disabled"
        @click="emit('request')"
      >
        <Sparkles :size="17" :class="{ 'animate-pulse': props.loading }" />
        {{ props.loading ? 'Préparation…' : 'Obtenir des recommandations' }}
      </button>
      <span v-if="props.quota" class="text-sm font-bold text-slate-500">
        {{ props.quota.remaining }} restante(s) · remise à zéro le {{ formatDate(props.quota.resetAt) }}
      </span>
    </div>

    <div v-if="props.items.length" class="mt-5 grid gap-3">
      <p class="text-xs font-black uppercase tracking-wide text-slate-500">Plan d'action recommandé</p>
      <article v-for="(item, index) in props.items" :key="item.title" class="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="absolute inset-y-0 left-0 w-1 rounded-l-2xl" :class="priorityBarClass(item.priority)" />
        <div class="pl-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h4 class="font-black text-ink">{{ index + 1 }}. {{ item.title }}</h4>
            <span class="rounded-full px-2.5 py-1 text-xs font-black" :class="priorityClass(item.priority)">{{ priorityLabel(item.priority) }}</span>
          </div>
          <p class="mt-3 font-bold leading-6 text-slate-800">{{ item.action }}</p>
          <p class="mt-3 border-t border-slate-100 pt-3 text-sm leading-5 text-slate-500">
            <span class="font-black text-slate-600">Pourquoi :</span> {{ item.reason }}
          </p>
        </div>
      </article>
    </div>

    <p v-if="props.trendsText" class="mt-5 border-t border-slate-100 pt-4 text-sm font-semibold leading-6 text-slate-500">
      {{ props.trendsText }}
    </p>
  </article>
</template>
