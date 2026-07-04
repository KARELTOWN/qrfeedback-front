<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ArrowUpRight, ExternalLink, ToggleLeft, ToggleRight } from 'lucide-vue-next';
import { useDashboard, type ReviewRedirectConfig } from '../../../composables/useDashboard';

const { getReviewRedirectConfig, updateReviewRedirectConfig } = useDashboard();
const redirectConfig = ref<ReviewRedirectConfig>({ enabled: false, goodRatingThreshold: 4, redirectUrl: null });
const redirectMessage = ref('');
const redirectMessageType = ref<'success' | 'error'>('success');
const redirectUrlInput = ref('');

async function saveRedirectConfig() {
  redirectMessage.value = '';
  try {
    const updated = await updateReviewRedirectConfig({
      ...redirectConfig.value,
      redirectUrl: redirectUrlInput.value.trim() || null,
    });
    redirectConfig.value = updated;
    redirectUrlInput.value = updated.redirectUrl ?? '';
    redirectMessage.value = 'Configuration enregistrée.';
    redirectMessageType.value = 'success';
  } catch (err) {
    redirectMessage.value = err instanceof Error ? err.message : 'Erreur inconnue';
    redirectMessageType.value = 'error';
  }
}

onMounted(async () => {
  const redirect = await getReviewRedirectConfig();
  redirectConfig.value = redirect;
  redirectUrlInput.value = redirect.redirectUrl ?? '';
});
</script>

<template>
  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
    <div class="mb-6 flex items-center gap-3">
      <span class="grid h-12 w-12 place-items-center rounded-full bg-brand-700 text-white"><ArrowUpRight :size="22" /></span>
      <div>
        <h2 class="text-2xl font-black text-ink">Redirection intelligente</h2>
        <p class="mt-1 font-semibold text-slate-500">Les bons avis sont redirigés vers votre page Google/Truspilot.... Les mauvais restent en interne.</p>
      </div>
    </div>

    <div class="grid gap-5">
      <!-- Toggle activation -->
      <div class="flex items-center justify-between rounded-2xl bg-white p-5">
        <div class="flex items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-xl" :class="redirectConfig.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'">
            <ExternalLink :size="18" />
          </span>
          <div>
            <strong class="block text-ink">Redirection des avis</strong>
            <span class="text-sm font-semibold text-slate-500">{{ redirectConfig.enabled ? 'Les bons avis sont redirigés vers Google' : 'Tous les avis restent en interne' }}</span>
          </div>
        </div>
        <button type="button" class="shrink-0 transition" @click="redirectConfig.enabled = !redirectConfig.enabled">
          <component :is="redirectConfig.enabled ? ToggleRight : ToggleLeft" :size="36" :class="redirectConfig.enabled ? 'text-brand-700' : 'text-slate-300'" />
        </button>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <!-- URL Google -->
        <label class="grid gap-2">
          <span class="text-xs font-black uppercase text-slate-500">URL de redirection (Google, TripAdvisor…)</span>
          <div class="relative">
            <ExternalLink class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" :size="16" />
            <input
              v-model="redirectUrlInput"
              type="url"
              placeholder="https://g.page/r/votre-id/review"
              class="h-11 w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <a v-if="redirectUrlInput" :href="redirectUrlInput" target="_blank" rel="noreferrer" class="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
            <ExternalLink :size="12" /> Tester le lien
          </a>
        </label>

        <!-- Seuil note positive -->
        <label class="grid gap-2">
          <span class="text-xs font-black uppercase text-slate-500">Seuil de bon avis (note ≥)</span>
          <select v-model.number="redirectConfig.goodRatingThreshold" class="h-11 rounded-xl border border-slate-300 bg-white px-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100">
            <option :value="3">3 étoiles et plus</option>
            <option :value="4">4 étoiles et plus</option>
            <option :value="5">5 étoiles uniquement</option>
          </select>
          <span class="text-xs font-semibold text-slate-400">En dessous de ce seuil, l'avis reste sur votre tableau de bord.</span>
        </label>
      </div>

      <!-- Visual recap -->
      <div class="rounded-2xl border border-slate-200 bg-white p-4">
        <p class="mb-3 text-xs font-black uppercase text-slate-500">Fonctionnement</p>
        <div class="grid gap-2 sm:grid-cols-2">
          <div class="flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3">
            <span class="text-xl">⭐</span>
            <div>
              <strong class="block text-sm text-emerald-700">Note ≥ {{ redirectConfig.goodRatingThreshold }}</strong>
              <span class="text-xs font-semibold text-emerald-600">→ Redirigé vers Google</span>
            </div>
          </div>
          <div class="flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3">
            <span class="text-xl">💬</span>
            <div>
              <strong class="block text-sm text-rose-700">Note &lt; {{ redirectConfig.goodRatingThreshold }}</strong>
              <span class="text-xs font-semibold text-rose-600">→ Reste dans votre dashboard</span>
            </div>
          </div>
        </div>
      </div>

      <p v-if="redirectMessage" class="rounded-xl px-4 py-3 text-sm font-bold" :class="redirectMessageType === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ redirectMessage }}</p>
      <button class="h-13 w-full rounded-xl bg-brand-700 px-5 text-base font-black text-white" @click="saveRedirectConfig">Enregistrer</button>
    </div>
  </div>
</template>
