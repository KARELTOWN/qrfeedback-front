<script setup lang="ts">
import { MessageSquareText, QrCode, ShieldCheck, Users } from 'lucide-vue-next';
import { useAdminContext } from '../../composables/useAdminContext';

const ctx = useAdminContext();
const { stats } = ctx;
</script>

<template>
  <section class="grid gap-6">
    <header class="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-black text-brand-700">
        <ShieldCheck :size="16" />
        Supervision
      </p>
      <h2 class="mt-3 text-3xl font-black text-ink">Vue plateforme</h2>
      <p class="mt-2 max-w-2xl font-semibold leading-7 text-slate-600">Suivez l'usage global, les comptes et la collecte d'avis sur Opinbase.</p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><MessageSquareText class="text-brand-700" /><p class="mt-4 font-bold text-slate-600">Avis collectés</p><strong class="mt-2 block text-4xl font-black text-ink">{{ stats?.totalReviews || 0 }}</strong></article>
      <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><QrCode class="text-brand-700" /><p class="mt-4 font-bold text-slate-600">QR codes créés</p><strong class="mt-2 block text-4xl font-black text-ink">{{ stats?.totalQrCodes || 0 }}</strong></article>
      <article class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><Users class="text-brand-700" /><p class="mt-4 font-bold text-slate-600">Comptes utilisateurs</p><strong class="mt-2 block text-4xl font-black text-ink">{{ stats?.totalUsers || 0 }}</strong></article>
      <article class="rounded-2xl border border-slate-200 bg-emerald-50 p-6 shadow-sm"><ShieldCheck class="text-emerald-700" /><p class="mt-4 font-bold text-emerald-900">Modèle</p><strong class="mt-2 block text-3xl font-black text-emerald-950">Gratuit</strong></article>
    </div>
    <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <h2 class="mb-2 text-xl font-black text-ink">À surveiller</h2>
      <p class="font-semibold leading-7 text-slate-600">Gardez un oeil sur les comptes inactifs, les QR sans compte et la progression des avis. L'administration suit maintenant l'usage réel de la plateforme gratuite.</p>
    </div>
  </section>
</template>
