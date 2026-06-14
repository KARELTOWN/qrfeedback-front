<script setup lang="ts">
import { useAdminContext } from '../../composables/useAdminContext';

const ctx = useAdminContext();
const { inactivePagination, inactiveUsers, formatDate, formatMoney, inactivePage, goInactivePage, BasePagination } = ctx;
</script>

<template>
  <section>
    <h2 class="mb-4 text-2xl font-black text-ink">Utilisateurs inactifs ({{ inactivePagination.total }})</h2>
    <div class="grid gap-3">
      <article v-for="item in inactiveUsers" :key="item.user._id" class="rounded-2xl border border-slate-200 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span>
            <strong class="block text-ink">{{ item.company?.name || item.user.email }}</strong>
            <span class="text-sm font-semibold text-slate-500">{{ item.reason }}</span>
            <span v-if="item.lastUsedAt" class="mt-1 block text-xs font-bold text-slate-400">Derniere utilisation: {{ formatDate(item.lastUsedAt) }}</span>
          </span>
          <span class="font-black text-brand-700">{{ formatMoney(item.revenueFcfa) }}</span>
        </div>
      </article>
    </div>
    <BasePagination :pagination="inactivePagination" :page="inactivePage" label="utilisateur(s) inactif(s)" @page-change="goInactivePage" />
  </section>
</template>
