<script setup lang="ts">
import { RefreshCcw } from 'lucide-vue-next';

defineProps<{
  title: string;
  loading?: boolean;
}>();

defineEmits<{
  refresh: [];
}>();
</script>

<template>
  <header class="m-4 flex items-center justify-between rounded-3xl bg-white px-5 py-5 shadow-sm lg:m-6 lg:px-8">
    <div>
      <p class="text-sm font-black uppercase tracking-wide text-brand-700">Administration</p>
      <h1 class="mt-1 text-3xl font-black text-black">{{ title }}</h1>
    </div>
    <button class="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-700 disabled:opacity-50" :disabled="loading" @click="$emit('refresh')">
      <RefreshCcw :size="20" />
    </button>
  </header>
</template>
