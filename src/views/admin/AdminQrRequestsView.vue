<script setup lang="ts">
import { useAdminContext } from '../../composables/useAdminContext';

const ctx = useAdminContext();
const { qrAccountFilter, qrSearch, qrRequests, formatDate, router, Eye, qrPage, goQrPage, BasePagination } = ctx;
</script>

<template>
  <section>
    <div class="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h2 class="text-2xl font-black text-ink">Demandes QR</h2>
        <p class="mt-1 text-sm font-bold text-slate-500">Total selon le filtre actif / total global</p>
      </div>
      <div class="inline-flex w-fit rounded-xl border border-slate-300 bg-white p-1">
        <button class="h-10 rounded-lg px-4 text-sm font-black" :class="qrAccountFilter === 'all' ? 'bg-brand-700 text-white' : 'text-slate-600'" @click="qrAccountFilter = 'all'">Tous</button>
        <button class="h-10 rounded-lg px-4 text-sm font-black" :class="qrAccountFilter === 'with' ? 'bg-brand-700 text-white' : 'text-slate-600'" @click="qrAccountFilter = 'with'">Avec compte</button>
        <button class="h-10 rounded-lg px-4 text-sm font-black" :class="qrAccountFilter === 'without' ? 'bg-brand-700 text-white' : 'text-slate-600'" @click="qrAccountFilter = 'without'">Sans compte</button>
      </div>
    </div>
    <input v-model="qrSearch" placeholder="Rechercher par nom, email, telephone" class="mb-4 h-12 w-full rounded-xl border border-slate-300 px-4 font-bold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100 xl:max-w-lg" />
    <div class="overflow-x-auto rounded-2xl border border-slate-300">
      <table class="min-w-[1040px] w-full text-left"><thead class="bg-slate-50"><tr><th class="px-5 py-4 font-black">Entreprise</th><th class="px-5 py-4 font-black">Email</th><th class="px-5 py-4 font-black">WhatsApp</th><th class="px-5 py-4 font-black">Compte</th><th class="px-5 py-4 font-black">Date demande</th><th class="px-5 py-4 font-black">Action</th></tr></thead>
        <tbody>
          <tr v-for="company in qrRequests.companies" :key="company._id" class="border-t border-slate-200">
            <td class="px-5 py-4 font-black">{{ company.name }}</td>
            <td class="px-5 py-4">{{ company.email }}</td>
            <td class="px-5 py-4">{{ company.whatsappNumber || '-' }}</td>
            <td class="px-5 py-4"><span class="rounded-full px-3 py-1 text-sm font-black" :class="company.hasAccount ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">{{ company.hasAccount ? 'Avec compte' : 'Sans compte' }}</span></td>
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
