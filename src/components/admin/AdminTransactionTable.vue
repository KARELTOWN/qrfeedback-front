<script setup lang="ts">
import type { AdminTransaction } from '../../composables/useAdmin';

defineProps<{
  title: string;
  transactions: AdminTransaction[];
}>();

function formatMoney(value = 0) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('fr-FR') : '-';
}
</script>

<template>
  <div class="overflow-x-auto rounded-2xl border border-slate-300">
    <h2 class="border-b border-slate-200 px-5 py-4 text-xl font-black text-ink">{{ title }}</h2>
    <table class="min-w-[760px] w-full text-left">
      <thead class="bg-slate-50">
        <tr>
          <th class="px-5 py-4 font-black">Entreprise</th>
          <th class="px-5 py-4 font-black">Plan</th>
          <th class="px-5 py-4 font-black">Montant</th>
          <th class="px-5 py-4 font-black">Statut</th>
          <th class="px-5 py-4 font-black">Date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="payment in transactions" :key="payment._id" class="border-t border-slate-200">
          <td class="px-5 py-4 font-black">{{ payment.company?.name || '-' }}</td>
          <td class="px-5 py-4">{{ payment.planLabel }}</td>
          <td class="px-5 py-4 font-black text-brand-700">{{ formatMoney(payment.amountFcfa) }}</td>
          <td class="px-5 py-4">{{ payment.status }}</td>
          <td class="px-5 py-4">{{ formatDate(payment.paidAt || payment.createdAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
