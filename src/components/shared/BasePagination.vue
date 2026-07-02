<script setup lang="ts">
type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const props = defineProps<{
  pagination: PaginationMeta;
  page: number;
  label: string;
}>();

const emit = defineEmits<{
  'page-change': [page: number];
}>();

function getPageNumbers(totalPages: number, currentPage: number) {
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }
  return Array.from(pages)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((a, b) => a - b);
}

function goTo(page: number) {
  emit('page-change', Math.min(Math.max(page, 1), props.pagination.totalPages));
}
</script>

<template>
  <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
    <span class="text-sm font-bold text-slate-500">{{ pagination.total }} {{ label }}</span>
    <div class="flex flex-wrap gap-2">
      <button class="h-10 rounded-xl border border-slate-300 px-4 font-black text-ink disabled:opacity-40" :disabled="page <= 1" @click="goTo(page - 1)">Precedent</button>
      <button v-for="pageNumber in getPageNumbers(pagination.totalPages, page)" :key="pageNumber" class="h-10 min-w-10 rounded-xl border px-3 font-black" :class="pageNumber === page ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 text-ink'" @click="goTo(pageNumber)">{{ pageNumber }}</button>
      <button class="h-10 rounded-xl border border-slate-300 px-4 font-black text-ink disabled:opacity-40" :disabled="page >= pagination.totalPages" @click="goTo(page + 1)">Suivant</button>
    </div>
  </div>
</template>
