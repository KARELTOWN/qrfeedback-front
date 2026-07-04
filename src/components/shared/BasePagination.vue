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

function getPageItems(totalPages: number, currentPage: number) {
  const pages = getPageNumbers(totalPages, currentPage);
  const items: Array<{ key: string; type: 'page' | 'ellipsis'; value: number }> = [];
  pages.forEach((pageNumber, index) => {
    const previous = pages[index - 1];
    if (previous !== undefined && pageNumber - previous === 2) {
      items.push({ key: `page-${previous + 1}`, type: 'page', value: previous + 1 });
    } else if (previous !== undefined && pageNumber - previous > 2) {
      items.push({ key: `ellipsis-${previous}`, type: 'ellipsis', value: previous });
    }
    items.push({ key: `page-${pageNumber}`, type: 'page', value: pageNumber });
  });
  return items;
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
      <template v-for="item in getPageItems(pagination.totalPages, page)" :key="item.key">
        <span v-if="item.type === 'ellipsis'" class="grid h-10 min-w-10 place-items-center font-black text-slate-400">…</span>
        <button v-else class="h-10 min-w-10 rounded-xl border px-3 font-black" :class="item.value === page ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 text-ink'" @click="goTo(item.value)">{{ item.value }}</button>
      </template>
      <button class="h-10 rounded-xl border border-slate-300 px-4 font-black text-ink disabled:opacity-40" :disabled="page >= pagination.totalPages" @click="goTo(page + 1)">Suivant</button>
    </div>
  </div>
</template>
