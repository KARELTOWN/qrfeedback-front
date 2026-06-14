<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { ArrowLeft, CheckCircle2, Gift, Mail, Send } from 'lucide-vue-next';
</script>

<template>
  <main class="min-h-screen bg-slate-100 px-4 py-10">
    <section class="mx-auto max-w-5xl">
      <RouterLink to="/dashboard" class="mb-5 inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-black text-ink shadow-sm transition hover:bg-slate-50">
        <ArrowLeft :size="18" /> Retour au tableau de bord
      </RouterLink>

      <div class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div class="rounded-3xl bg-ink p-8 text-white shadow-xl">
          <span class="grid h-14 w-14 place-items-center rounded-full bg-white/10"><Gift :size="28" /></span>
          <p class="mt-8 text-sm font-black uppercase tracking-wide text-brand-100">Plateforme gratuite</p>
          <h1 class="mt-3 text-4xl font-black leading-tight">QrFeedback est gratuit.</h1>
          <p class="mt-5 text-lg font-medium leading-8 text-slate-300">
            Vous pouvez collecter les avis et recevoir les notifications sans achat.
          </p>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
          <div class="grid gap-4">
            <div class="flex items-start gap-4 rounded-2xl bg-brand-50 p-4">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand-700"><CheckCircle2 :size="22" /></span>
              <div>
                <strong class="block text-lg font-black text-ink">Acces illimite</strong>
                <p class="mt-1 font-semibold text-slate-600">Plus de quota lie au plan pour utiliser la plateforme.</p>
              </div>
            </div>
            <div class="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand-700"><Mail :size="22" /></span>
              <div>
                <strong class="block text-lg font-black text-ink">Emails actifs</strong>
                <p class="mt-1 font-semibold text-slate-600">Les notifications email ne sont plus limitees par un forfait.</p>
              </div>
            </div>
            <div class="flex items-start gap-4 rounded-2xl bg-slate-50 p-4">
              <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-brand-700"><Send :size="22" /></span>
              <div>
                <strong class="block text-lg font-black text-ink">Telegram disponible</strong>
                <p class="mt-1 font-semibold text-slate-600">Les comptes connectes peuvent continuer a recevoir les avis sur Telegram.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
