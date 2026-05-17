<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { CreditCard, Wallet } from 'lucide-vue-next';
import { usePayments, type Payment, type Plan } from '../composables/usePayments';

const route = useRoute();
const { getPlans, createPayment: createPaymentRequest } = usePayments();
const plans = ref<Plan[]>([]);
const selectedPlan = ref('');
const email = ref('');
const payment = ref<Payment | null>(null);
const error = ref('');

onMounted(async () => {
  plans.value = await getPlans();
  selectedPlan.value = plans.value[1]?.code || '';
});

async function createPayment() {
  error.value = '';
  try {
    payment.value = await createPaymentRequest(
      { companySlug: route.params.slug, planCode: selectedPlan.value, email: email.value || undefined },
      !route.params.slug
    );

    if (payment.value.checkoutUrl) {
      window.location.href = payment.value.checkoutUrl;
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur inconnue';
  }
}
</script>

<template>
  <main class="min-h-screen bg-slate-100 px-4 py-10">
    <section class="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <div class="rounded-3xl bg-ink p-8 text-white shadow-xl">
        <span class="grid h-14 w-14 place-items-center rounded-full bg-white/10"><Wallet :size="28" /></span>
        <p class="mt-8 text-sm font-black uppercase tracking-wide text-brand-100">Forfaits WhatsApp</p>
        <h1 class="mt-3 text-4xl font-black leading-tight">Achetez des crédits de notifications.</h1>
        <p class="mt-5 text-lg font-medium leading-8 text-slate-300">
          Le paiement se fait via Moneroo. Après confirmation, la facture et le mot de passe du compte sont envoyés par email.
        </p>
      </div>

      <form class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8" @submit.prevent="createPayment">
        <label class="block">
          <span class="mb-2 block font-extrabold text-ink">Email de facturation</span>
          <input v-model="email" type="email" class="h-13 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
        </label>

        <div class="mt-6 grid gap-3">
          <label v-for="plan in plans" :key="plan.code" class="grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-4 rounded-2xl border p-4 transition" :class="selectedPlan === plan.code ? 'border-brand-700 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300'">
            <input v-model="selectedPlan" type="radio" :value="plan.code" class="h-5 w-5 accent-brand-700" />
            <span>
              <strong class="block text-lg font-black text-ink">{{ plan.label }}</strong>
              <span class="text-sm font-semibold text-slate-500">{{ plan.messages }} notifications WhatsApp</span>
            </span>
            <span class="font-black text-ink">{{ plan.priceFcfa.toLocaleString() }} FCFA</span>
          </label>
        </div>

        <button class="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 text-base font-black text-white transition hover:bg-brand-600">
          <CreditCard :size="20" /> Créer la demande de paiement
        </button>
        <p v-if="error" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{{ error }}</p>
      </form>

      <div v-if="payment" class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 class="text-2xl font-black text-ink">Paiement en attente</h2>
        <p class="mt-3 font-semibold text-slate-600">Montant: {{ payment.amountFcfa.toLocaleString() }} FCFA</p>
        <p v-if="payment.checkoutUrl" class="font-semibold text-slate-600">Lien Moneroo prêt.</p>
        <p class="font-semibold text-slate-600">Réseau: {{ payment.network }}</p>
        <a v-if="payment.checkoutUrl" :href="payment.checkoutUrl" class="mt-4 inline-flex rounded-xl bg-brand-700 px-5 py-3 font-black text-white">Ouvrir le paiement Moneroo</a>
        <code v-else class="mt-4 block break-all rounded-xl bg-slate-100 p-4 font-bold text-ink">{{ payment.moneroWalletAddress }}</code>
      </div>
    </section>
  </main>
</template>
