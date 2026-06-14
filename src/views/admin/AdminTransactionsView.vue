<script setup lang="ts">
import { useAdminContext } from '../../composables/useAdminContext';

const ctx = useAdminContext();
const { filters, filterUsers, VueDatePicker, applyTransactionFilters, transactions, formatMoney, formatDate, transactionPage, goTransactionPage, BasePagination } = ctx;
</script>

<template>
  <section class="grid gap-5">
    <div class="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto]">
      <select v-model="filters.userId" class="h-12 rounded-xl border border-slate-300 px-3 font-bold"><option value="">Tous les utilisateurs</option><option v-for="user in filterUsers" :key="user._id" :value="user._id">{{ user.company?.name || user.email }}</option></select>
      <VueDatePicker
        v-model="filters.dateRange"
        range
        multi-calendars
        model-type="yyyy-MM-dd"
        :formats="{ input: 'dd/MM/yyyy', preview: 'dd/MM/yyyy' }"
        placeholder="Selectionner une periode"
        :enable-time-picker="false"
        auto-apply
      />
      <button class="h-12 rounded-xl bg-brand-700 px-5 font-black text-white" @click="applyTransactionFilters">Filtrer</button>
    </div>
    <div class="rounded-2xl bg-emerald-50 p-5"><p class="font-bold text-black">Montant genere selon le filtre actif</p><strong class="mt-1 block text-3xl font-black text-black">{{ formatMoney(transactions.totalRevenueFcfa) }}</strong><span class="mt-1 block text-sm font-bold text-slate-600">{{ transactions.pagination.total }} transaction(s)</span></div>
    <div class="overflow-x-auto rounded-2xl border border-slate-300">
      <table class="min-w-[900px] w-full text-left">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-5 py-4 font-black">Date paiement</th>
            <th class="px-5 py-4 font-black">Montant paye</th>
            <th class="px-5 py-4 font-black">Plan</th>
            <th class="px-5 py-4 font-black">Statut</th>
            <th class="px-5 py-4 font-black">Utilisateur</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="payment in transactions.transactions" :key="payment._id" class="border-t border-slate-200">
            <td class="px-5 py-4 font-semibold text-slate-600">{{ formatDate(payment.paidAt || payment.createdAt) }}</td>
            <td class="px-5 py-4 font-black text-brand-700">{{ formatMoney(payment.amountFcfa) }}</td>
            <td class="px-5 py-4 font-black text-ink">{{ payment.planLabel }}</td>
            <td class="px-5 py-4"><span class="rounded-full px-3 py-1 text-sm font-black" :class="payment.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : payment.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'">{{ payment.status }}</span></td>
            <td class="px-5 py-4 font-semibold text-slate-600">{{ payment.company?.name || payment.company?.email || '-' }}</td>
          </tr>
          <tr v-if="!transactions.transactions.length">
            <td colspan="5" class="px-5 py-10 text-center font-bold text-slate-500">Aucune transaction pour le filtre actif.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <BasePagination :pagination="transactions.pagination" :page="transactionPage" label="transaction(s) trouvee(s)" @page-change="goTransactionPage" />
  </section>


</template>
