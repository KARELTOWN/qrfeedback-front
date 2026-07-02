<script setup lang="ts">
import {
  QrCode, Star, BarChart3, Brain, Bell, MessageCircle, Send, ArrowRight,
  Repeat2, Globe, Code2, ShieldCheck, FileSpreadsheet, Search, Zap,
  SlidersHorizontal, FileText, TrendingUp, Target, Download, Layers
} from 'lucide-vue-next';

const BOT_LINK = 'https://t.me/Opinbasebot';

const stats = [
  { value: 'Illimité', label: 'QR codes par entreprise' },
  { value: '5 canaux', label: "Modes d'alerte" },
  { value: 'IA incluse', label: 'Analyse automatique' },
  { value: 'Gratuit', label: 'Pour démarrer' },
];

const allFeatures = [
  { icon: QrCode, title: 'QR codes illimités', desc: 'Un QR par table, caisse, chambre ou point de contact.' },
  { icon: Download, title: 'Export PNG & PDF', desc: 'Téléchargez vos QR prêts à imprimer en un clic.' },
  { icon: SlidersHorizontal, title: 'Formulaire personnalisé', desc: 'Questions custom, champs obligatoires, labels adaptés.' },
  { icon: Star, title: 'Note 5 étoiles', desc: 'Interface cliente simple, rapide, mobile-first.' },
  { icon: BarChart3, title: 'Tableau de bord', desc: "KPI en temps réel : note, conversion, tendance." },
  { icon: TrendingUp, title: "Graphes d'évolution", desc: "Comparez cette année vs l'année précédente." },
  { icon: Brain, title: 'Analyse IA', desc: "Détection automatique des sujets récurrents et problèmes." },
  { icon: Search, title: 'Recherche sémantique', desc: 'Interrogez vos avis en langage naturel.' },
  { icon: FileText, title: 'Rapport IA PDF', desc: "Exportez l'analyse complète en PDF avec graphes." },
  { icon: Bell, title: 'Alertes email', desc: 'Notification immédiate à chaque nouvel avis.' },
  { icon: Send, title: 'Bot Telegram', desc: 'Alertes, stats et gestion directement dans Telegram.' },
  { icon: MessageCircle, title: 'SMS manager', desc: 'Alerte SMS sur les mauvais avis sous votre seuil.' },
  { icon: Repeat2, title: 'Réponse auto client', desc: 'Email ou SMS de remerciement envoyé au client.' },
  { icon: Globe, title: 'Redirection intelligente', desc: 'Bons avis → Google. Mauvais avis → interne.' },
  { icon: Code2, title: "Widget témoignages", desc: "Intégrez un carrousel d'avis sur votre site web." },
  { icon: FileSpreadsheet, title: 'Export Excel', desc: 'Exportez tous vos avis en .xlsx en un clic.' },
  { icon: Target, title: 'Objectif satisfaction', desc: 'Définissez une cible et suivez votre progression.' },
  { icon: ShieldCheck, title: 'Anti-bot Turnstile', desc: 'Protection Cloudflare sur le formulaire client.' },
  { icon: Layers, title: 'Widget embarquable', desc: 'Iframe responsive, auto-redimensionnable.' },
  { icon: Zap, title: 'Rapport hebdo PDF', desc: 'Récapitulatif automatique chaque semaine via Telegram.' },
];
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <!-- Header -->
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="flex items-center" aria-label="Opinbase">
          <img :src="'/assets/logo-horizontal.png'" alt="Opinbase" class="h-10 w-auto max-w-[160px] object-contain" />
        </RouterLink>
        <nav class="flex items-center gap-4 text-sm font-bold text-brand-700">
          <RouterLink to="/fonctionnalites" class="hidden sm:inline">Fonctionnalités</RouterLink>
          <RouterLink to="/bot" class="hidden items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 transition hover:bg-brand-100 sm:inline-flex">
            <MessageCircle :size="15" />
            Bot Telegram
          </RouterLink>
          <RouterLink to="/login">Connexion</RouterLink>
          <RouterLink to="/signup" class="hidden items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-white transition hover:bg-brand-600 sm:inline-flex">
            Démarrer gratuitement
            <ArrowRight :size="14" />
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Hero -->
    <section class="mx-auto max-w-7xl px-4 pt-16 pb-12 text-center sm:px-6 lg:px-8 lg:pt-24 lg:pb-16">
      <span class="mb-4 inline-block rounded-full bg-brand-100 px-4 py-2 text-sm font-black text-brand-700">
        Toutes les fonctionnalités
      </span>
      <h1 class="mt-4 text-5xl font-black leading-tight text-ink sm:text-6xl lg:text-7xl">
        Tout ce qu'il faut pour<br class="hidden sm:block" /> gérer votre réputation.
      </h1>
      <p class="mx-auto mt-6 max-w-2xl text-xl font-semibold leading-8 text-slate-600">
        De la collecte d'avis à l'analyse IA, en passant par les alertes en temps réel — une seule plateforme, zéro friction.
      </p>
      <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
        <RouterLink to="/signup" class="inline-flex items-center gap-2 rounded-2xl bg-brand-700 px-8 py-4 text-lg font-black text-white shadow-lg transition hover:bg-brand-600">
          Démarrer gratuitement
          <ArrowRight :size="18" />
        </RouterLink>
        <RouterLink to="/bot" class="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-8 py-4 text-lg font-black text-ink transition hover:border-brand-700 hover:text-brand-700">
          <Send :size="18" />
          Voir le bot Telegram
        </RouterLink>
      </div>
    </section>

    <!-- Stats bar -->
    <section class="border-y border-slate-200 bg-white py-8">
      <div class="mx-auto grid max-w-4xl grid-cols-2 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div v-for="s in stats" :key="s.label" class="text-center">
          <p class="text-3xl font-black text-brand-700">{{ s.value }}</p>
          <p class="mt-1 text-sm font-bold text-slate-500">{{ s.label }}</p>
        </div>
      </div>
    </section>

    <!-- Section 1 — QR Codes & collecte -->
    <section class="py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span class="mb-3 inline-block rounded-full bg-brand-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-brand-700">Collecte</span>
            <h2 class="text-4xl font-black leading-tight text-ink sm:text-5xl">
              Un QR code, et vos clients parlent.
            </h2>
            <p class="mt-5 text-lg font-semibold leading-8 text-slate-600">
              Créez autant de QR codes que vous avez de points de contact. Chaque QR ouvre un formulaire personnalisé — note, commentaire, questions custom — accessible en quelques secondes depuis n'importe quel smartphone.
            </p>
            <ul class="mt-8 space-y-3">
              <li v-for="item in [
                'QR codes illimités par entreprise',
                'Formulaire avec questions personnalisées',
                'Champs : texte, email, téléphone, note, liste',
                'Export QR en PNG et PDF imprimable',
                'Activation / désactivation par QR',
              ]" :key="item" class="flex items-center gap-3 text-base font-semibold text-ink">
                <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700 text-xs font-black">✓</span>
                {{ item }}
              </li>
            </ul>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div v-for="card in [
              { icon: QrCode, title: 'QR illimités', sub: 'Un par emplacement', color: 'bg-brand-100 text-brand-700' },
              { icon: SlidersHorizontal, title: 'Form. custom', sub: 'Vos propres questions', color: 'bg-violet-100 text-violet-700' },
              { icon: Download, title: 'PNG & PDF', sub: 'Prêt à imprimer', color: 'bg-amber-100 text-amber-700' },
              { icon: Star, title: '5 étoiles', sub: 'Interface mobile', color: 'bg-emerald-100 text-emerald-700' },
            ]" :key="card.title" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span :class="['mb-3 inline-grid h-11 w-11 place-items-center rounded-xl', card.color]">
                <component :is="card.icon" :size="20" />
              </span>
              <p class="font-black text-ink">{{ card.title }}</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-500">{{ card.sub }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 2 — Dashboard & Analytics -->
    <section class="bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-12 lg:grid-cols-2">
          <div class="order-2 grid grid-cols-2 gap-4 lg:order-1">
            <div v-for="card in [
              { icon: BarChart3, title: 'KPIs temps réel', sub: 'Note, volume, conversion', color: 'bg-brand-100 text-brand-700' },
              { icon: TrendingUp, title: 'Tendances', sub: 'N vs N-1', color: 'bg-sky-100 text-sky-700' },
              { icon: Target, title: 'Objectif', sub: 'Suivi de satisfaction', color: 'bg-amber-100 text-amber-700' },
              { icon: FileSpreadsheet, title: 'Export Excel', sub: 'Tous vos avis', color: 'bg-emerald-100 text-emerald-700' },
            ]" :key="card.title" class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <span :class="['mb-3 inline-grid h-11 w-11 place-items-center rounded-xl', card.color]">
                <component :is="card.icon" :size="20" />
              </span>
              <p class="font-black text-ink">{{ card.title }}</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-500">{{ card.sub }}</p>
            </div>
          </div>
          <div class="order-1 lg:order-2">
            <span class="mb-3 inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-sky-700">Analytics</span>
            <h2 class="text-4xl font-black leading-tight text-ink sm:text-5xl">
              Des données qui vous guident vraiment.
            </h2>
            <p class="mt-5 text-lg font-semibold leading-8 text-slate-600">
              Votre tableau de bord affiche en temps réel la note moyenne, le taux de conversion scan → avis, les tendances sur 4 à 8 semaines et une comparaison glissante année par année.
            </p>
            <ul class="mt-8 space-y-3">
              <li v-for="item in [
                'Taux de conversion scan → avis avec indicateur santé',
                'Graphe d\'évolution mensuelle N vs N-1',
                'Distribution des notes par étoile',
                'Sparkline de tendance par QR code',
                'Signalement automatique des QR sous-performants',
              ]" :key="item" class="flex items-center gap-3 text-base font-semibold text-ink">
                <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-700 text-xs font-black">✓</span>
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 3 — IA -->
    <section class="py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span class="mb-3 inline-block rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-violet-700">Intelligence artificielle</span>
            <h2 class="text-4xl font-black leading-tight text-ink sm:text-5xl">
              L'IA détecte ce que vous ne voyez pas.
            </h2>
            <p class="mt-5 text-lg font-semibold leading-8 text-slate-600">
              L'analyse IA lit tous vos avis et remonte automatiquement les sujets récurrents, les problèmes prioritaires et les recommandations actionnables — avec comparaison entre deux périodes.
            </p>
            <ul class="mt-8 space-y-3">
              <li v-for="item in [
                'Détection des sujets et problèmes récurrents',
                'Taux positif / neutre / négatif automatique',
                'Recherche sémantique en langage naturel',
                '3 suggestions de réponse par avis',
                'Export du rapport IA complet en PDF',
                'Recommandations business actionnables',
              ]" :key="item" class="flex items-center gap-3 text-base font-semibold text-ink">
                <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700 text-xs font-black">✓</span>
                {{ item }}
              </li>
            </ul>
          </div>
          <div class="grid gap-4">
            <div class="rounded-2xl border border-violet-100 bg-violet-50 p-6">
              <Brain :size="32" class="mb-4 text-violet-700" />
              <h3 class="text-xl font-black text-ink">Détection des problèmes</h3>
              <p class="mt-2 text-base font-semibold text-slate-600">L'IA identifie les thèmes récurrents dans vos avis négatifs avec fréquence, impact et exemples directs.</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div class="rounded-2xl border border-slate-200 bg-white p-5">
                <Search :size="20" class="mb-3 text-violet-600" />
                <p class="font-black text-ink">Recherche IA</p>
                <p class="mt-0.5 text-sm font-semibold text-slate-500">Langage naturel</p>
              </div>
              <div class="rounded-2xl border border-slate-200 bg-white p-5">
                <FileText :size="20" class="mb-3 text-violet-600" />
                <p class="font-black text-ink">Rapport PDF</p>
                <p class="mt-0.5 text-sm font-semibold text-slate-500">Export complet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 4 — Alertes multicanal -->
    <section class="bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-14 text-center">
          <span class="mb-3 inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-amber-700">Notifications</span>
          <h2 class="text-4xl font-black text-ink sm:text-5xl">Alerté où que vous soyez.</h2>
          <p class="mx-auto mt-5 max-w-2xl text-lg font-semibold text-slate-500">
            Choisissez un ou plusieurs canaux. Chaque QR code peut avoir ses propres préférences.
          </p>
        </div>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-7">
            <span class="mb-4 inline-grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">
              <Bell :size="22" />
            </span>
            <h3 class="text-xl font-black text-ink">Email</h3>
            <p class="mt-2 text-base font-semibold leading-7 text-slate-600">Recevez chaque nouvel avis directement dans votre boîte mail. 300 emails gratuits par mois.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-7">
            <span class="mb-4 inline-grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-700">
              <Send :size="22" />
            </span>
            <h3 class="text-xl font-black text-ink">Telegram</h3>
            <p class="mt-2 text-base font-semibold leading-7 text-slate-600">Notification instantanée sur votre téléphone via le bot @Opinbasebot. Actions rapides intégrées.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-7">
            <span class="mb-4 inline-grid h-12 w-12 place-items-center rounded-2xl bg-red-100 text-red-600">
              <MessageCircle :size="22" />
            </span>
            <h3 class="text-xl font-black text-ink">SMS manager</h3>
            <p class="mt-2 text-base font-semibold leading-7 text-slate-600">Alerte SMS immédiate quand un avis dépasse votre seuil critique. Vous pouvez agir en secondes.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-7">
            <span class="mb-4 inline-grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <Repeat2 :size="22" />
            </span>
            <h3 class="text-xl font-black text-ink">Réponse auto client</h3>
            <p class="mt-2 text-base font-semibold leading-7 text-slate-600">Email ou SMS de remerciement automatique envoyé au client si son contact est renseigné.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-7">
            <span class="mb-4 inline-grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700">
              <Zap :size="22" />
            </span>
            <h3 class="text-xl font-black text-ink">Rapport hebdo PDF</h3>
            <p class="mt-2 text-base font-semibold leading-7 text-slate-600">Récapitulatif automatique chaque semaine envoyé via Telegram avec l'évolution de la semaine.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-7">
            <span class="mb-4 inline-grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <SlidersHorizontal :size="22" />
            </span>
            <h3 class="text-xl font-black text-ink">Contrôle par QR</h3>
            <p class="mt-2 text-base font-semibold leading-7 text-slate-600">Chaque QR code peut activer ou désactiver Email et Telegram indépendamment du réglage global.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Section 5 — Redirection intelligente + Témoignages -->
    <section class="py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid gap-8 lg:grid-cols-2">
          <div class="rounded-3xl bg-brand-700 p-10 text-white">
            <Globe :size="40" class="mb-5 text-brand-200" />
            <h2 class="text-3xl font-black">Redirection intelligente</h2>
            <p class="mt-4 text-base font-semibold leading-7 text-brand-100">
              Configurez un seuil. Les bons avis (≥ 4 étoiles par exemple) redirigent automatiquement le client vers votre page Google ou TripAdvisor. Les mauvais avis restent internes pour que vous puissiez agir.
            </p>
            <ul class="mt-6 space-y-2 text-sm font-semibold text-brand-200">
              <li class="flex items-center gap-2"><span class="text-white">✓</span> Seuil personnalisable (3, 4 ou 5 étoiles)</li>
              <li class="flex items-center gap-2"><span class="text-white">✓</span> URL de redirection configurable</li>
              <li class="flex items-center gap-2"><span class="text-white">✓</span> Countdown 3 secondes avant redirection</li>
            </ul>
          </div>
          <div class="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
            <Code2 :size="40" class="mb-5 text-violet-600" />
            <h2 class="text-3xl font-black text-ink">Widget témoignages</h2>
            <p class="mt-4 text-base font-semibold leading-7 text-slate-600">
              Intégrez un carrousel d'avis sur votre site web en copiant-collant un simple code HTML. Le widget est responsive, s'auto-redimensionne et se met à jour automatiquement.
            </p>
            <ul class="mt-6 space-y-2 text-sm font-semibold text-slate-500">
              <li class="flex items-center gap-2"><span class="text-brand-700">✓</span> Carousel automatique toutes les 3 secondes</li>
              <li class="flex items-center gap-2"><span class="text-brand-700">✓</span> Navigation manuelle avec points</li>
              <li class="flex items-center gap-2"><span class="text-brand-700">✓</span> Iframe responsive auto-resize</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Full feature grid -->
    <section class="bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-12 text-center">
          <h2 class="text-4xl font-black text-ink sm:text-5xl">Tout est inclus.</h2>
          <p class="mx-auto mt-4 max-w-xl text-lg font-semibold text-slate-500">Sans surprise, sans module payant caché.</p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="f in allFeatures"
            :key="f.title"
            class="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 transition hover:border-brand-200"
          >
            <span class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
              <component :is="f.icon" :size="18" />
            </span>
            <div>
              <p class="font-black text-ink">{{ f.title }}</p>
              <p class="mt-0.5 text-sm font-semibold text-slate-500">{{ f.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-brand-700 py-16 lg:py-24">
      <div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 class="text-4xl font-black text-white sm:text-5xl">Prêt à collecter vos premiers avis ?</h2>
        <p class="mt-6 text-xl font-semibold text-brand-100">Gratuit. Sans carte bancaire. En 2 minutes.</p>
        <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
          <RouterLink to="/signup" class="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-black text-brand-700 shadow-lg transition hover:bg-brand-50">
            Démarrer gratuitement
            <ArrowRight :size="18" />
          </RouterLink>
          <a :href="BOT_LINK" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 rounded-2xl border border-brand-500 px-8 py-4 text-lg font-black text-white transition hover:bg-brand-600">
            <Send :size="18" />
            Essayer le bot Telegram
          </a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white py-8">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="flex items-center" aria-label="Opinbase">
          <img :src="'/assets/logo-horizontal.png'" alt="Opinbase" class="h-8 w-auto max-w-[140px] object-contain" />
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
