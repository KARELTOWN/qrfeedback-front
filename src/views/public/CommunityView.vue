<script setup lang="ts">
import { QrCode, MessageCircle, Send, Users, Bell, Lightbulb, ArrowRight, Zap, BookOpen } from 'lucide-vue-next';

const COMMUNITY_LINK = 'https://t.me/QrFeedback_Bot';
const BOT_LINK = 'https://t.me/QrFeedback_Bot';

const benefits = [
  {
    icon: Bell,
    title: 'Nouveautés en avant-première',
    desc: "Soyez les premiers informés des nouvelles fonctionnalités, mises à jour et améliorations de la plateforme.",
    color: 'bg-sky-100 text-sky-700',
  },
  {
    icon: Lightbulb,
    title: 'Conseils & bonnes pratiques',
    desc: "Apprenez comment d'autres entreprises utilisent QR Feedback pour améliorer leur réputation au quotidien.",
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Users,
    title: 'Entraide entre membres',
    desc: "Posez vos questions, partagez vos retours d'expérience et obtenez des réponses de la communauté.",
    color: 'bg-violet-100 text-violet-700',
  },
  {
    icon: Zap,
    title: 'Support direct',
    desc: "Accédez à une ligne directe avec l'équipe QR Feedback pour signaler des bugs ou suggérer des améliorations.",
    color: 'bg-brand-100 text-brand-700',
  },
  {
    icon: BookOpen,
    title: 'Tutoriels & guides',
    desc: "Retrouvez des guides pas à pas pour tirer le meilleur parti de chaque fonctionnalité de la plateforme.",
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: MessageCircle,
    title: 'Discussions produit',
    desc: "Influencez la roadmap. Vos retours sont directement transmis à l'équipe produit.",
    color: 'bg-red-100 text-red-600',
  },
];

const steps = [
  { num: '1', title: 'Ouvrez Telegram', desc: "Téléchargez Telegram si ce n'est pas déjà fait, ou ouvrez l'application." },
  { num: '2', title: "Rejoignez le groupe", desc: "Cliquez sur le bouton ci-dessous pour accéder directement au groupe de la communauté QR Feedback." },
  { num: '3', title: 'Présentez-vous !', desc: "Dites bonjour, partagez votre activité et commencez à échanger avec les autres membres." },
];
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <!-- Header -->
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="flex items-center gap-3 text-xl font-black text-ink">
          <span class="grid h-10 w-10 place-items-center rounded-full bg-brand-700 text-white">
            <QrCode :size="22" />
          </span>
          QR Feedback
        </RouterLink>
        <nav class="flex items-center gap-4 text-sm font-bold text-brand-700">
          <RouterLink to="/fonctionnalites" class="hidden sm:inline">Fonctionnalités</RouterLink>
          <RouterLink to="/bot" class="hidden items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 transition hover:bg-brand-100 sm:inline-flex">
            <MessageCircle :size="15" />
            Bot Telegram
          </RouterLink>
          <RouterLink to="/login">Connexion</RouterLink>
          <RouterLink to="/signup" class="hidden items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-white transition hover:bg-brand-600 sm:inline-flex">
            Démarrer
            <ArrowRight :size="14" />
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Hero -->
    <section class="mx-auto max-w-7xl px-4 pt-16 pb-12 text-center sm:px-6 lg:px-8 lg:pt-24 lg:pb-16">
      <span class="mb-4 inline-flex items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-black text-sky-700">
        <Send :size="16" />
        Communauté Telegram
      </span>
      <h1 class="mt-4 text-5xl font-black leading-tight text-ink sm:text-6xl lg:text-7xl">
        Rejoignez la<br class="hidden sm:block" />
        communauté.
      </h1>
      <p class="mx-auto mt-6 max-w-2xl text-xl font-semibold leading-8 text-slate-600">
        Échangez avec d'autres dirigeants, suivez les nouveautés et obtenez du support directement sur Telegram.
      </p>
      <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
        <a
          :href="COMMUNITY_LINK"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-3 rounded-2xl bg-sky-500 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:bg-sky-600"
        >
          <Send :size="20" />
          Rejoindre sur Telegram
        </a>
        <a
          :href="BOT_LINK"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-4 text-lg font-black text-ink transition hover:border-sky-400 hover:text-sky-600"
        >
          <MessageCircle :size="20" />
          Ouvrir le bot
        </a>
      </div>
    </section>

    <!-- Telegram callout -->
    <section class="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div class="overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 to-sky-600 shadow-xl">
        <div class="flex flex-col items-center gap-6 px-8 py-14 text-center lg:flex-row lg:text-left">
          <div class="flex-1">
            <p class="text-sm font-black uppercase tracking-widest text-sky-200">100 % sur Telegram</p>
            <h2 class="mt-3 text-4xl font-black text-white">Une communauté là où vous êtes déjà.</h2>
            <p class="mt-4 text-lg font-semibold leading-8 text-sky-100">
              Pas d'app supplémentaire, pas de forum à part. La communauté QR Feedback vit sur Telegram — l'outil que vous utilisez déjà pour recevoir vos alertes d'avis en temps réel.
            </p>
          </div>
          <div class="shrink-0">
            <div class="grid h-32 w-32 place-items-center rounded-3xl bg-white/20 text-white">
              <Send :size="56" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Benefits grid -->
    <section class="bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-12 text-center">
          <h2 class="text-4xl font-black text-ink sm:text-5xl">Pourquoi rejoindre ?</h2>
          <p class="mx-auto mt-4 max-w-xl text-lg font-semibold text-slate-500">Ce que vous gagnez en faisant partie de la communauté.</p>
        </div>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="b in benefits"
            :key="b.title"
            class="rounded-2xl border border-slate-200 bg-slate-50 p-7 transition hover:border-sky-200"
          >
            <span :class="['mb-4 inline-grid h-12 w-12 place-items-center rounded-2xl', b.color]">
              <component :is="b.icon" :size="22" />
            </span>
            <h3 class="text-xl font-black text-ink">{{ b.title }}</h3>
            <p class="mt-2 text-base font-semibold leading-7 text-slate-600">{{ b.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How to join -->
    <section class="py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-12 text-center">
          <h2 class="text-4xl font-black text-ink sm:text-5xl">Comment rejoindre ?</h2>
          <p class="mx-auto mt-4 max-w-xl text-lg font-semibold text-slate-500">Trois étapes, moins d'une minute.</p>
        </div>
        <div class="grid gap-6 sm:grid-cols-3">
          <div v-for="step in steps" :key="step.num" class="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <span class="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-700 text-xl font-black text-white">
              {{ step.num }}
            </span>
            <h3 class="text-xl font-black text-ink">{{ step.title }}</h3>
            <p class="mt-2 text-base font-semibold leading-7 text-slate-600">{{ step.desc }}</p>
          </div>
        </div>
        <div class="mt-10 text-center">
          <a
            :href="COMMUNITY_LINK"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-3 rounded-2xl bg-sky-500 px-10 py-5 text-xl font-black text-white shadow-lg transition hover:bg-sky-600"
          >
            <Send :size="22" />
            Rejoindre la communauté Telegram
            <ArrowRight :size="18" />
          </a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white py-8">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="flex items-center gap-2 text-base font-black text-ink">
          <span class="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-white"><QrCode :size="16" /></span>
          QR Feedback
        </RouterLink>
        <div class="flex flex-wrap gap-5 text-sm font-bold text-slate-500">
          <RouterLink to="/" class="hover:text-brand-700">Accueil</RouterLink>
          <RouterLink to="/fonctionnalites" class="hover:text-brand-700">Fonctionnalités</RouterLink>
          <RouterLink to="/bot" class="hover:text-brand-700">Bot Telegram</RouterLink>
          <RouterLink to="/communaute" class="hover:text-brand-700">Communauté</RouterLink>
          <RouterLink to="/signup" class="hover:text-brand-700">Inscription</RouterLink>
        </div>
      </div>
    </footer>
  </div>
</template>
