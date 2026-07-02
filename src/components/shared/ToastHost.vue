<script setup lang="ts">
import { useToast } from '../../composables/useToast';

const { toasts, removeToast } = useToast();

function toastClass(kind: string) {
  if (kind === 'error') return 'bg-red-50 text-red-700 ring-red-200';
  if (kind === 'info') return 'bg-sky-50 text-sky-700 ring-sky-200';
  return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-50 grid max-w-sm gap-3">
    <button
      v-for="toast in toasts"
      :key="toast.id"
      type="button"
      class="rounded-2xl px-5 py-4 text-left text-sm font-black shadow-xl ring-1 transition hover:-translate-y-0.5"
      :class="toastClass(toast.kind)"
      @click="removeToast(toast.id)"
    >
      {{ toast.message }}
    </button>
  </div>
</template>
