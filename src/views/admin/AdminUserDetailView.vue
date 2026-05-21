<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, CreditCard, MessageSquareText, QrCode, ReceiptText } from 'lucide-vue-next';
import { useAdmin, type AdminUserDetails } from '../../composables/useAdmin';

const route = useRoute();
const router = useRouter();
const { getUserDetails } = useAdmin();
const details = ref<AdminUserDetails | null>(null);
const error = ref('');

function formatMoney(value = 0) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('fr-FR') : '-';
}

onMounted(async () => {
  try {
    details.value = await getUserDetails(String(route.params.userId));
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur inconnue';
  }
});
</script>

<template>
  <main class="min-h-screen bg-slate-100 p-4 lg:p-8">
    <button class="mb-5 inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-black text-ink" @click="router.push('/admin/users')">
      <ArrowLeft :size="18" /> Retour
    </button>

    <p v-if="error" class="rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{{ error }}</p>

    <section v-if="details" class="grid gap-6">
      <div class="rounded-3xl bg-white p-6 shadow-sm">
        <p class="text-sm font-black uppercase tracking-wide text-brand-700">Utilisateur</p>
        <h1 class="mt-1 text-3xl font-black text-ink">{{ details.company.name }}</h1>
        <p class="mt-2 font-semibold text-slate-600">{{ details.user.email }}</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article class="rounded-2xl bg-white p-5 shadow-sm"><QrCode class="text-brand-700" /><p class="mt-3 font-bold">QR codes</p><strong class="text-3xl font-black">{{ details.qrCodesCount }}</strong></article>
        <article class="rounded-2xl bg-white p-5 shadow-sm"><MessageSquareText class="text-brand-700" /><p class="mt-3 font-bold">Avis recoltes</p><strong class="text-3xl font-black">{{ details.reviewsCount }}</strong></article>
        <article class="rounded-2xl bg-white p-5 shadow-sm"><CreditCard class="text-brand-700" /><p class="mt-3 font-bold">Credits restants</p><strong class="text-3xl font-black">{{ details.remainingCredits }}</strong></article>
        <article class="rounded-2xl bg-white p-5 shadow-sm xl:col-span-2"><ReceiptText class="text-brand-700" /><p class="mt-3 font-bold">Revenu genere</p><strong class="text-3xl font-black">{{ formatMoney(details.revenueFcfa) }}</strong></article>
      </div>

      <div class="overflow-x-auto rounded-3xl border border-slate-300 bg-white">
        <h2 class="border-b border-slate-200 px-6 py-5 text-2xl font-black text-ink">Paiements et plans</h2>
        <table class="min-w-[820px] w-full text-left">
          <thead class="bg-slate-50">
            <tr><th class="px-6 py-4 font-black">Plan</th><th class="px-6 py-4 font-black">Messages</th><th class="px-6 py-4 font-black">Montant</th><th class="px-6 py-4 font-black">Statut</th><th class="px-6 py-4 font-black">Date</th></tr>
          </thead>
          <tbody>
            <tr v-for="payment in details.payments" :key="payment._id" class="border-t border-slate-200">
              <td class="px-6 py-4 font-black">{{ payment.planLabel }}</td>
              <td class="px-6 py-4">{{ payment.messages }}</td>
              <td class="px-6 py-4 font-black text-brand-700">{{ formatMoney(payment.amountFcfa) }}</td>
              <td class="px-6 py-4">{{ payment.status }}</td>
              <td class="px-6 py-4">{{ formatDate(payment.paidAt || payment.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
