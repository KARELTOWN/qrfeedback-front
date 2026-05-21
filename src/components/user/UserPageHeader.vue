<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { RefreshCcw } from 'lucide-vue-next';

defineProps<{
  title: string;
}>();

defineEmits<{
  refresh: [];
}>();
</script>

<template>
  <header class="m-4 flex items-center justify-between rounded-3xl bg-white px-5 py-5 shadow-sm lg:m-6 lg:px-8">
    <div>
      <p class="text-sm font-black uppercase tracking-wide text-brand-700">Entreprise</p>
      <h1 class="mt-1 text-3xl font-black text-black">{{ title }}</h1>
    </div>
    <div class="flex items-center gap-3">
      <RouterLink to="/paiement" class="hidden rounded-full border border-brand-700 px-5 py-3 text-sm font-black text-brand-700 sm:inline-flex">Acheter des messages</RouterLink>
      <button class="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-700" @click="$emit('refresh')"><RefreshCcw :size="20" /></button>
    </div>
  </header>
</template>
