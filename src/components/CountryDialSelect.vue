<script setup lang="ts">
import { computed, ref } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import { countries } from '../constants/countries';

const model = defineModel<string>({ required: true });
const open = ref(false);

const selected = computed(() => countries.find((country) => country.dialCode === model.value) || countries[0]);

function selectCountry(dialCode: string) {
  model.value = dialCode;
  open.value = false;
}

function closeSoon() {
  window.setTimeout(() => {
    open.value = false;
  }, 120);
}
</script>

<template>
  <div class="relative min-w-0">
    <button
      type="button"
      class="flex h-14 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 text-left font-black text-ink outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-100"
      @click="open = !open"
      @blur="closeSoon"
    >
      <span class="flex min-w-0 items-center gap-2">
        <img :src="selected.flagUrl" :alt="selected.name" class="h-5 w-7 rounded-sm object-cover shadow-sm" />
        <span class="max-w-20 truncate">{{ selected.name }}</span>
        <span>{{ selected.dialCode }}</span>
      </span>
      <ChevronDown :size="18" class="shrink-0 text-slate-500" />
    </button>

    <div v-if="open" class="absolute left-0 top-full z-50 mt-2 max-h-72 w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
      <button
        v-for="country in countries"
        :key="country.code"
        type="button"
        class="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-bold text-ink hover:bg-slate-100"
        @mousedown.prevent="selectCountry(country.dialCode)"
      >
        <img :src="country.flagUrl" :alt="country.name" class="h-5 w-7 rounded-sm object-cover shadow-sm" />
        <span class="flex-1">{{ country.name }}</span>
        <span class="text-slate-500">{{ country.dialCode }}</span>
      </button>
    </div>
  </div>
</template>
