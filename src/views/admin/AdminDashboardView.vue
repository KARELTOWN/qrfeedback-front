<script setup lang="ts">
import { useAdminContext } from '../../composables/useAdminContext';

const ctx = useAdminContext();
const { stats, formatMoney, TransactionTable } = ctx;
</script>

<template>
  <section class="grid gap-6">
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl bg-sky-50 p-6"><p class="font-bold text-black">Avis generes</p><strong class="mt-2 block text-4xl font-black text-black">{{ stats?.totalReviews || 0 }}</strong></article>
      <article class="rounded-2xl bg-emerald-50 p-6"><p class="font-bold text-black">QR Code generes</p><strong class="mt-2 block text-4xl font-black text-black">{{ stats?.totalQrCodes || 0 }}</strong></article>
      <article class="rounded-2xl bg-amber-50 p-6"><p class="font-bold text-black">Comptes utilisateurs</p><strong class="mt-2 block text-4xl font-black text-black">{{ stats?.totalUsers || 0 }}</strong></article>
      <article class="rounded-2xl bg-rose-50 p-6"><p class="font-bold text-black">Revenus totaux</p><strong class="mt-2 block text-3xl font-black text-black">{{ formatMoney(stats?.totalRevenueFcfa) }}</strong></article>
    </div>
    <div class="grid gap-6 xl:grid-cols-2">
      <TransactionTable title="15 dernieres transactions" :transactions="stats?.latestTransactions || []" />
      <div class="rounded-2xl border border-slate-200 p-5">
        <h2 class="mb-4 text-xl font-black text-ink">20 meilleurs payeurs</h2>
        <div class="grid gap-3">
          <div v-for="payer in stats?.topPayers || []" :key="payer.company._id" class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span><strong class="block text-ink">{{ payer.company.name }}</strong><span class="text-sm font-semibold text-slate-500">{{ payer.paymentsCount }} paiement(s)</span></span>
            <span class="font-black text-brand-700">{{ formatMoney(payer.amount) }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>


</template>
