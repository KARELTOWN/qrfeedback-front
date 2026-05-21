<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { MessageSquareText, Star } from 'lucide-vue-next';
import { useCompany, type CustomQuestionConfig, type FeedbackFieldConfig, type FeedbackFormConfig } from '../../composables/useCompany';
import { useReviews } from '../../composables/useReviews';
import CountryDialSelect from '../../components/CountryDialSelect.vue';
import { buildInternationalPhone, digitsOnly } from '../../constants/countries';

type CompanyPublic = {
  name: string;
  slug: string;
  feedbackUrl: string;
  feedbackFormConfig: FeedbackFormConfig;
};

const route = useRoute();
const { getPublicCompany } = useCompany();
const { createReview } = useReviews();
const company = ref<CompanyPublic | null>(null);
const form = ref({
  serviceFeedback: '',
  customAnswers: [] as Array<{ questionId: string; value: string | number }>,
  rating: 0
});
const loading = ref(false);
const sent = ref(false);
const error = ref('');
const customPhoneDialCodes = ref<Record<string, string>>({});
const customPhoneLocalNumbers = ref<Record<string, string>>({});
const stars = computed(() => [1, 2, 3, 4, 5]);
const formConfig = computed(() => company.value?.feedbackFormConfig);
const enabledFields = computed(() => formConfig.value?.fields.filter((field) => field.enabled && field.key === 'serviceFeedback') || []);

onMounted(async () => {
  company.value = await getPublicCompany(route.params.slug);
});

function fieldConfig(key: FeedbackFieldConfig['key']) {
  return enabledFields.value.find((field) => field.key === key);
}

function isFieldRequired(key: FeedbackFieldConfig['key']) {
  return Boolean(fieldConfig(key)?.required);
}

function customAnswer(question: CustomQuestionConfig) {
  let answer = form.value.customAnswers.find((item) => item.questionId === question.id);
  if (!answer) {
    answer = { questionId: question.id, value: '' };
    form.value.customAnswers.push(answer);
  }
  return answer;
}

function isCustomRequiredMissing(question: CustomQuestionConfig) {
  if (!question.required) return false;
  const value = customAnswer(question).value;
  return value === '' || value === undefined || value === null;
}

function validateCustomAnswer(question: CustomQuestionConfig) {
  const value = customAnswer(question).value;
  if (value === '' || value === undefined || value === null) return true;
  if (question.type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value));
  if (question.type === 'phone') return /^\+[1-9]\d{7,14}$/.test(String(value).replace(/\s/g, ''));
  return true;
}

function updateCustomPhone(question: CustomQuestionConfig, localNumber: string) {
  customPhoneLocalNumbers.value[question.id] = digitsOnly(localNumber);
  const dialCode = customPhoneDialCodes.value[question.id] || '+229';
  customPhoneDialCodes.value[question.id] = dialCode;
  customAnswer(question).value = customPhoneLocalNumbers.value[question.id] ? buildInternationalPhone(dialCode, customPhoneLocalNumbers.value[question.id]) : '';
}

function updateCustomPhoneDial(question: CustomQuestionConfig, dialCode: string) {
  customPhoneDialCodes.value[question.id] = dialCode;
  updateCustomPhone(question, customPhoneLocalNumbers.value[question.id] || '');
}

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    const missingField = enabledFields.value.find((field) => field.required && !String(form.value[field.key] || '').trim());
    if (missingField) throw new Error(`${missingField.label} est requis.`);
    const missingQuestion = formConfig.value?.customQuestions.find(isCustomRequiredMissing);
    if (missingQuestion) throw new Error(`${missingQuestion.label} est requis.`);
    const invalidQuestion = formConfig.value?.customQuestions.find((question) => !validateCustomAnswer(question));
    if (invalidQuestion) throw new Error(`${invalidQuestion.label} est invalide.`);
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
            <h1 class="mt-1 text-3xl font-black text-ink sm:text-4xl">{{ formConfig?.title || company?.name || 'Entreprise' }}</h1>
          </div>
        </div>

        <div class="grid gap-5">
          <label v-if="fieldConfig('serviceFeedback')" class="block">
            <span class="mb-2 block font-extrabold text-ink">{{ fieldConfig('serviceFeedback')?.label }} <span v-if="isFieldRequired('serviceFeedback')" class="text-red-600">*</span></span>
            <textarea v-model="form.serviceFeedback" :required="isFieldRequired('serviceFeedback')" :placeholder="fieldConfig('serviceFeedback')?.placeholder" rows="3" class="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
          </label>

          <label v-for="question in formConfig?.customQuestions || []" :key="question.id" class="block">
            <span class="mb-2 block font-extrabold text-ink">{{ question.label }} <span v-if="question.required" class="text-red-600">*</span></span>
            <input v-if="question.type === 'text'" v-model="customAnswer(question).value" :required="question.required" :placeholder="question.placeholder" class="h-13 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
            <textarea v-else-if="question.type === 'textarea'" v-model="customAnswer(question).value" :required="question.required" :placeholder="question.placeholder" rows="3" class="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
            <input v-else-if="question.type === 'email'" v-model.trim="customAnswer(question).value" type="email" :required="question.required" :placeholder="question.placeholder || 'contact@entreprise.com'" class="h-13 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
            <div v-else-if="question.type === 'phone'" class="grid grid-cols-[140px_1fr] gap-3">
              <CountryDialSelect :model-value="customPhoneDialCodes[question.id] || '+229'" @update:model-value="updateCustomPhoneDial(question, $event)" />
              <input
                :value="customPhoneLocalNumbers[question.id] || ''"
                :required="question.required"
                inputmode="numeric"
                pattern="[0-9]*"
                :placeholder="question.placeholder || '0199997478'"
                class="h-14 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100"
                @input="updateCustomPhone(question, ($event.target as HTMLInputElement).value)"
              />
            </div>
            <select v-else-if="question.type === 'select'" v-model="customAnswer(question).value" :required="question.required" class="h-13 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100">
              <option value="">Choisir une option</option>
              <option v-for="option in question.options || []" :key="option" :value="option">{{ option }}</option>
            </select>
            <div v-else class="flex gap-2">
              <button v-for="star in stars" :key="`${question.id}-${star}`" type="button" class="grid h-11 w-11 place-items-center rounded-xl border transition" :class="Number(customAnswer(question).value) >= star ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-slate-200 bg-white text-slate-300'" @click="customAnswer(question).value = star">
                <Star :size="24" />
              </button>
            </div>
          </label>

          <div class="rounded-2xl bg-slate-50 p-5">
            <span class="block font-black text-ink">Donnez-nous une note *</span>
            <div class="mt-3 flex gap-2">
              <button v-for="star in stars" :key="star" type="button" class="grid h-12 w-12 place-items-center rounded-xl border transition" :class="form.rating >= star ? 'border-amber-300 bg-amber-50 text-amber-500' : 'border-slate-200 bg-white text-slate-300'" @click="form.rating = star">
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
        <p class="mt-3 font-semibold text-slate-500">Votre retour a bien ete transmis.</p>
      </div>
    </section>
  </main>
</template>
