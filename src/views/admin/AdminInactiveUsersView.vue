<script setup lang="ts">
import { Clock3 } from 'lucide-vue-next';
import { useAdminContext } from '../../composables/useAdminContext';

const ctx = useAdminContext();
const { inactivePagination, inactiveUsers, formatDate, inactivePage, goInactivePage, BasePagination } = ctx;
</script>

<template>
  <section class="grid gap-5">
    <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p class="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-sm font-black text-amber-700">
        <Clock3 :size="16" />
        {{ inactivePagination.total }} compte(s)
      </p>
      <h2 class="mt-3 text-2xl font-black text-ink">Utilisateurs inactifs</h2>
      <p class="mt-1 font-semibold text-slate-500">Comptes à relancer ou à examiner selon leur dernière activité.</p>
    </div>
    <div class="grid gap-3">
      <article v-for="item in inactiveUsers" :key="item.user._id" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span>
            <strong class="block text-ink">{{ item.company?.name || item.user.email }}</strong>
            <span class="text-sm font-semibold text-slate-500">{{ item.reason }}</span>
            <span v-if="item.lastUsedAt" class="mt-1 block text-xs font-bold text-slate-400">Dernière utilisation: {{ formatDate(item.lastUsedAt) }}</span>
          </span>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600">À suivre</span>
        </div>
      </article>
      <p v-if="!inactiveUsers.length" class="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center font-bold text-slate-500">Aucun utilisateur inactif.</p>
    </div>
    <BasePagination :pagination="inactivePagination" :page="inactivePage" label="utilisateur(s) inactif(s)" @page-change="goInactivePage" />
  </section>
</template>
