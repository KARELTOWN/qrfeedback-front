<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { CheckCircle2, Loader2, XCircle } from 'lucide-vue-next';
import { usePayments } from '../../composables/usePayments';

const route = useRoute();
const router = useRouter();
const { verifyPayment } = usePayments();
const status = ref<'loading' | 'success' | 'error'>('loading');
const message = ref('Verification du paiement en cours...');

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) return value[0] ? String(value[0]) : '';
  return value ? String(value) : '';
}

onMounted(async () => {
  const paymentId =
    firstQueryValue(route.query.paymentId) ||
    firstQueryValue(route.query.payment_id) ||
    firstQueryValue(route.query.transaction_id) ||
    firstQueryValue(route.query.id) ||
    firstQueryValue(route.query.reference);

  if (!paymentId) {
    status.value = 'error';
    message.value = 'Reference de paiement introuvable.';
    return;
  }

  try {
    await verifyPayment(paymentId, firstQueryValue(route.query.transaction_id) || firstQueryValue(route.query.transactionId));
    status.value = 'success';
    message.value = 'Paiement confirme. Votre acces illimite est actif.';
  } catch (error) {
    status.value = 'error';
    message.value = error instanceof Error ? error.message : 'Paiement non confirme.';
  }
});
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-slate-100 px-4">
    <section class="w-full max-w-xl rounded-3xl bg-white p-8 text-center shadow-xl shadow-slate-200">
      <Loader2 v-if="status === 'loading'" :size="52" class="mx-auto animate-spin text-brand-700" />
      <CheckCircle2 v-else-if="status === 'success'" :size="56" class="mx-auto text-brand-700" />
      <XCircle v-else :size="56" class="mx-auto text-red-600" />
      <h1 class="mt-6 text-3xl font-black text-ink">{{ status === 'success' ? 'Paiement valide' : status === 'error' ? 'Paiement a verifier' : 'Verification' }}</h1>
      <p class="mt-3 font-semibold text-slate-600">{{ message }}</p>
      <button class="mt-8 rounded-xl bg-brand-700 px-5 py-3 font-black text-white" @click="router.push('/dashboard')">
        Aller au dashboard
      </button>
    </section>
  </main>
</template>
