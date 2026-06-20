<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Mail, MessageSquareText, QrCode, ShieldCheck } from 'lucide-vue-next';
import { useAdmin, type AdminUserDetails } from '../../composables/useAdmin';

const route = useRoute();
const router = useRouter();
const { getUserDetails } = useAdmin();
const details = ref<AdminUserDetails | null>(null);
const error = ref('');

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
      <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-black text-brand-700">
          <ShieldCheck :size="16" />
          Utilisateur
        </p>
        <h1 class="mt-1 text-3xl font-black text-ink">{{ details.company.name }}</h1>
        <p class="mt-2 inline-flex items-center gap-2 font-semibold text-slate-600"><Mail :size="17" /> {{ details.user.email }}</p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><QrCode class="text-brand-700" /><p class="mt-3 font-bold text-slate-600">QR codes</p><strong class="text-3xl font-black text-ink">{{ details.qrCodesCount }}</strong></article>
        <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><MessageSquareText class="text-brand-700" /><p class="mt-3 font-bold text-slate-600">Avis collectés</p><strong class="text-3xl font-black text-ink">{{ details.reviewsCount }}</strong></article>
        <article class="rounded-2xl border border-slate-200 bg-emerald-50 p-5 shadow-sm"><ShieldCheck class="text-emerald-700" /><p class="mt-3 font-bold text-emerald-900">Accès</p><strong class="text-3xl font-black text-emerald-950">Gratuit</strong></article>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-2xl font-black text-ink">Résumé du compte</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <p class="rounded-2xl bg-slate-50 p-4 font-semibold text-slate-600"><span class="block text-xs font-black uppercase text-slate-500">Entreprise</span>{{ details.company.name }}</p>
          <p class="rounded-2xl bg-slate-50 p-4 font-semibold text-slate-600"><span class="block text-xs font-black uppercase text-slate-500">Email</span>{{ details.user.email }}</p>
          <p class="rounded-2xl bg-slate-50 p-4 font-semibold text-slate-600"><span class="block text-xs font-black uppercase text-slate-500">Dernière vérification</span>{{ formatDate(new Date().toISOString()) }}</p>
          <p class="rounded-2xl bg-slate-50 p-4 font-semibold text-slate-600"><span class="block text-xs font-black uppercase text-slate-500">Statut produit</span>Application gratuite</p>
        </div>
      </div>
    </section>
  </main>
</template>
