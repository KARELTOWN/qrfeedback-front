<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { useAdminContext } from '../../composables/useAdminContext';
import type { AdminAccountStatus } from '../../composables/useAdmin';

const ctx = useAdminContext();
const { qrAccountFilter, qrSearch, qrRequests, formatDate, router, Eye, qrPage, goQrPage, BasePagination } = ctx;

const statusLabels: Record<AdminAccountStatus, string> = {
  active: 'Compte actif',
  inactive: 'Compte inactif',
  disabled: 'Compte désactivé',
  none: 'Sans compte'
};
const statusClasses: Record<AdminAccountStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  inactive: 'bg-slate-100 text-slate-600',
  disabled: 'bg-red-50 text-red-700',
  none: 'bg-amber-50 text-amber-700'
};
</script>

<template>
  <section class="grid gap-5">
    <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 class="text-2xl font-black text-ink">Demandes QR</h2>
          <p class="mt-1 font-semibold text-slate-500">Un compte par email unique, avec ou sans compte utilisateur.</p>
        </div>
        <div class="inline-flex w-fit rounded-xl border border-slate-300 bg-white p-1">
          <button class="h-10 rounded-lg px-4 text-sm font-black" :class="qrAccountFilter === 'all' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'" @click="qrAccountFilter = 'all'">Tous</button>
          <button class="h-10 rounded-lg px-4 text-sm font-black" :class="qrAccountFilter === 'with' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'" @click="qrAccountFilter = 'with'">Avec compte</button>
          <button class="h-10 rounded-lg px-4 text-sm font-black" :class="qrAccountFilter === 'without' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'" @click="qrAccountFilter = 'without'">Sans compte</button>
        </div>
      </div>
      <div class="relative mt-4 max-w-xl">
        <Search class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
        <input v-model="qrSearch" placeholder="Rechercher par nom ou email" class="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-4 font-bold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
      </div>
    </div>
    <div class="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-[1040px] w-full text-left"><thead class="bg-slate-50"><tr><th class="px-5 py-4 font-black">Entreprise</th><th class="px-5 py-4 font-black">Email</th><th class="px-5 py-4 font-black">Statut compte</th><th class="px-5 py-4 font-black">Dernière connexion</th><th class="px-5 py-4 font-black">Date demande</th><th class="px-5 py-4 font-black">Action</th></tr></thead>
        <tbody>
          <tr v-for="company in qrRequests.companies" :key="company.email" class="border-t border-slate-200 transition hover:bg-slate-50">
            <td class="px-5 py-4 font-black">{{ company.name }}{{ company.qrRequestsCount > 1 ? ` (+${company.qrRequestsCount - 1})` : '' }}</td>
            <td class="px-5 py-4">{{ company.email }}</td>
            <td class="px-5 py-4"><span class="rounded-full px-3 py-1 text-sm font-black" :class="statusClasses[company.status as AdminAccountStatus]">{{ statusLabels[company.status as AdminAccountStatus] }}</span></td>
            <td class="px-5 py-4">{{ company.lastLoginAt ? formatDate(company.lastLoginAt) : 'Jamais connecté' }}</td>
            <td class="px-5 py-4">{{ formatDate(company.createdAt) }}</td>
            <td class="px-5 py-4">
              <button v-if="company.userId" class="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-ink transition hover:bg-slate-100" title="Voir le detail" aria-label="Voir le detail" @click="router.push(`/admin/user/${company.userId}`)">
                <Eye :size="17" />
              </button>
              <span v-else class="text-slate-400">-</span>
            </td>
          </tr>
          <tr v-if="!qrRequests.companies.length">
            <td colspan="6" class="px-5 py-10 text-center font-bold text-slate-500">Aucune demande QR ne correspond au filtre.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <BasePagination :pagination="qrRequests.pagination" :page="qrPage" label="demande(s) trouvee(s)" @page-change="goQrPage" />
  </section>
</template>
