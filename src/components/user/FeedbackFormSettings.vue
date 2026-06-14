<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronDown, Plus, Trash2 } from 'lucide-vue-next';
import type { CustomQuestionConfig, FeedbackFormConfig } from '../../composables/useDashboard';

const props = defineProps<{
  modelValue: FeedbackFormConfig | null;
  message?: string;
}>();

const emit = defineEmits<{
  save: [];
}>();

const config = computed(() => props.modelValue);
const visibleFields = computed(() => config.value?.fields.filter((field) => field.key === 'serviceFeedback') || []);
const customQuestionsOpen = ref(true);

function addCustomQuestion() {
  if (!config.value) return;
  config.value.customQuestions.push({
    id: `q_${Date.now()}`,
    type: 'text',
    label: 'Nouvelle question',
    placeholder: '',
    required: false,
    options: []
  });
  customQuestionsOpen.value = true;
}

function removeCustomQuestion(question: CustomQuestionConfig) {
  if (!config.value) return;
  const confirmed = window.confirm(`Supprimer la question "${question.label}" ?`);
  if (!confirmed) return;
  config.value.customQuestions = config.value.customQuestions.filter((item) => item.id !== question.id);
}

function normalizeQuestionOptions(question: CustomQuestionConfig) {
  if (question.type !== 'select') {
    question.options = [];
    return;
  }
  if (!question.options?.length) question.options = ['Option 1', 'Option 2'];
}
</script>

<template>
  <div v-if="config" class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
    <div class="mb-6">
      <h2 class="text-2xl font-black text-ink">Formulaire de feedback</h2>
      <p class="mt-1 font-semibold text-slate-500">Personnalisez les libellés et ajoutez quelques questions simples.</p>
    </div>

    <label class="block">
      <span class="mb-2 block font-black text-ink">Titre du formulaire</span>
      <input v-model="config.title" class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
    </label>

    <div class="mt-6 grid gap-3">
      <h3 class="text-lg font-black text-ink">Champs existants</h3>
      <article v-for="field in visibleFields" :key="field.key" class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[auto_1fr_1fr_auto] lg:items-center">
        <label class="flex items-center gap-2 font-black text-ink"><input v-model="field.enabled" type="checkbox" class="h-5 w-5" /> Actif</label>
        <input v-model="field.label" class="h-11 rounded-xl border border-slate-300 px-3 font-semibold outline-none focus:border-brand-700" />
        <input v-model="field.placeholder" placeholder="Texte indicatif" class="h-11 rounded-xl border border-slate-300 px-3 font-semibold outline-none focus:border-brand-700" />
        <label class="flex items-center gap-2 font-black text-ink"><input v-model="field.required" type="checkbox" class="h-5 w-5" /> Obligatoire</label>
      </article>
    </div>

    <section class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-4">
        <button class="inline-flex items-center gap-2 text-left text-lg font-black text-ink" type="button" @click="customQuestionsOpen = !customQuestionsOpen">
          <ChevronDown :size="20" class="transition" :class="customQuestionsOpen ? 'rotate-0' : '-rotate-90'" />
          Questions personnalisées
          <span class="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-black text-brand-700">{{ config.customQuestions.length }}</span>
        </button>
        <button class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-100" type="button" @click="addCustomQuestion">
          <Plus :size="18" /> Ajouter
        </button>
      </div>

      <div v-if="customQuestionsOpen" class="grid gap-4 p-4">
        <article v-for="question in config.customQuestions" :key="question.id" class="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div class="grid gap-3 lg:grid-cols-[1fr_180px_auto_44px] lg:items-center">
            <input v-model="question.label" class="h-11 rounded-xl border border-slate-300 px-3 font-semibold outline-none focus:border-brand-700" />
            <select v-model="question.type" class="h-11 rounded-xl border border-slate-300 px-3 font-semibold outline-none focus:border-brand-700" @change="normalizeQuestionOptions(question)">
              <option value="text">Texte court</option>
              <option value="fullName">Nom et prénoms</option>
              <option value="textarea">Paragraphe</option>
              <option value="email">Email</option>
              <option value="phone">Téléphone</option>
              <option value="rating">Note</option>
              <option value="select">Liste déroulante</option>
            </select>
            <label class="flex items-center gap-2 font-black text-ink"><input v-model="question.required" type="checkbox" class="h-5 w-5" /> Obligatoire</label>
            <button class="group relative grid h-11 w-11 place-items-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-600 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-100" type="button" title="Supprimer la question" aria-label="Supprimer la question" @click="removeCustomQuestion(question)">
              <Trash2 :size="18" />
              <span class="pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-lg bg-ink px-3 py-1 text-xs font-bold text-white shadow-lg group-hover:block">Supprimer</span>
            </button>
          </div>
          <input v-model="question.placeholder" placeholder="Texte indicatif" class="h-11 rounded-xl border border-slate-300 px-3 font-semibold outline-none focus:border-brand-700" />
          <input v-if="question.type === 'select'" :value="(question.options || []).join(', ')" placeholder="Options séparées par des virgules" class="h-11 rounded-xl border border-slate-300 px-3 font-semibold outline-none focus:border-brand-700" @input="question.options = ($event.target as HTMLInputElement).value.split(',').map((item) => item.trim()).filter(Boolean)" />
        </article>

        <div v-if="!config.customQuestions.length" class="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p class="font-bold text-slate-500">Aucune question personnalisée.</p>
          <button class="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-black text-white transition hover:bg-brand-600" type="button" @click="addCustomQuestion">
            <Plus :size="18" /> Ajouter une question
          </button>
        </div>
      </div>
    </section>

    <p v-if="message" class="mt-4 rounded-xl px-4 py-3 text-sm font-bold" :class="message.includes('enregistr') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ message }}</p>
    <button class="mt-6 h-13 w-full rounded-xl bg-brand-700 px-5 text-base font-black text-white shadow-sm transition hover:bg-brand-600 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-100" @click="emit('save')">Enregistrer</button>
  </div>
</template>
