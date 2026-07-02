<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { Menu, RefreshCcw } from 'lucide-vue-next';

defineProps<{
  title: string;
}>();

defineEmits<{
  menu: [];
  refresh: [];
}>();
</script>

<template>
  <header class="m-4 flex items-center justify-between gap-4 rounded-3xl bg-white px-5 py-5 shadow-sm lg:m-6 lg:px-8">
    <div class="flex min-w-0 items-center gap-3">
      <button class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 lg:hidden" aria-label="Ouvrir le menu" @click="$emit('menu')">
        <Menu :size="21" />
      </button>
      <div class="min-w-0">
      <p class="text-sm font-black uppercase tracking-wide text-brand-700">Entreprise</p>
      <h1 class="mt-1 truncate text-2xl font-black text-black sm:text-3xl">{{ title }}</h1>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <button class="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-700" @click="$emit('refresh')"><RefreshCcw :size="20" /></button>
    </div>
  </header>
</template>
