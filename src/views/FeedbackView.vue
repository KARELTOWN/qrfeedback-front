<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { MessageSquareText, Star } from 'lucide-vue-next';
import { useCompany } from '../composables/useCompany';
import { useReviews } from '../composables/useReviews';

type CompanyPublic = {
  name: string;
  slug: string;
  feedbackUrl: string;
};

const route = useRoute();
const { getPublicCompany } = useCompany();
const { createReview } = useReviews();
const company = ref<CompanyPublic | null>(null);
const form = ref({
  customerName: '',
  customerPhone: '',
  serviceFeedback: '',
  improvementSuggestion: '',
  badExperience: '',
  rating: 0
});
const loading = ref(false);
const sent = ref(false);
const error = ref('');
const stars = computed(() => [1, 2, 3, 4, 5]);

onMounted(async () => {
  company.value = await getPublicCompany(route.params.slug);
});

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    await createReview(route.params.slug, form.value);
    sent.value = true;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-100 px-4 py-8 sm:py-12">
    <section class="mx-auto max-w-3xl">
      <form v-if="!sent" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-10" @submit.prevent="submit">
        <div class="mb-8 flex items-start gap-4">
          <span class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-700 text-white">
            <MessageSquareText :size="26" />
          </span>
          <div>
            <p class="text-sm font-black uppercase tracking-wide text-brand-700">Avis client</p>
            <h1 class="mt-1 text-3xl font-black text-ink sm:text-4xl">{{ company?.name || 'Entreprise' }}</h1>
          </div>
        </div>

        <div class="grid gap-5">
          <label class="block">
            <span class="mb-2 block font-extrabold text-ink">Nom du client</span>
            <input v-model="form.customerName" placeholder="Votre nom" class="h-13 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
          </label>
          <label class="block">
            <span class="mb-2 block font-extrabold text-ink">Téléphone</span>
            <input v-model="form.customerPhone" placeholder="Votre numéro" class="h-13 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
          </label>
          <label class="block">
            <span class="mb-2 block font-extrabold text-ink">Que pensez-vous de nos services ?</span>
            <textarea v-model="form.serviceFeedback" rows="3" class="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
          </label>
          <label class="block">
            <span class="mb-2 block font-extrabold text-ink">Que doit-on améliorer ?</span>
            <textarea v-model="form.improvementSuggestion" rows="3" class="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
          </label>
          <label class="block">
            <span class="mb-2 block font-extrabold text-ink">Avez-vous eu une mauvaise expérience ?</span>
            <textarea v-model="form.badExperience" rows="3" class="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
          </label>

          <div class="rounded-2xl bg-slate-50 p-5">
            <span class="block font-black text-ink">Donnez-nous une note *</span>
            <div class="mt-3 flex gap-2">
              <button
                v-for="star in stars"
                :key="star"
                type="button"
                class="grid h-12 w-12 place-items-center rounded-xl border transition"
                :class="form.rating >= star ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-slate-200 bg-white text-slate-300'"
                @click="form.rating = star"
              >
                <Star :size="28" />
              </button>
            </div>
          </div>
        </div>

        <button class="mt-6 h-14 w-full rounded-xl bg-brand-700 text-base font-black text-white transition hover:bg-brand-600 disabled:opacity-60" :disabled="loading || !form.rating">
          {{ loading ? 'Envoi...' : 'Envoyer mon avis' }}
        </button>
        <p v-if="error" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{{ error }}</p>
      </form>

      <div v-else class="rounded-3xl bg-white p-10 text-center shadow-xl shadow-slate-200">
        <h1 class="text-4xl font-black text-ink">Merci pour votre avis.</h1>
        <p class="mt-3 font-semibold text-slate-500">Votre retour a bien été transmis.</p>
      </div>
    </section>
  </main>
</template>
