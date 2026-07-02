<script setup lang="ts">
import { Bell, BarChart3, Zap, MessageCircle, QrCode, ArrowRight, Send, Star, TrendingUp, FileText } from 'lucide-vue-next';

const BOT_LINK = 'https://t.me/Opinbasebot';

const features = [
  {
    icon: Bell,
    title: 'Alertes instantanées',
    description: "Recevez une notification Telegram dès qu'un client laisse un avis. Réagissez immédiatement, même en déplacement.",
    color: 'bg-brand-100 text-brand-700',
  },
  {
    icon: Star,
    title: 'Signalement des mauvais avis',
    description: "Le bot vous alerte en priorité quand une note est en dessous de votre seuil. Ne laissez plus passer un avis négatif sans réponse.",
    color: 'bg-red-100 text-red-600',
  },
  {
    icon: BarChart3,
    title: 'Statistiques à la demande',
    description: "Consultez vos chiffres clés directement depuis Telegram sans ouvrir le dashboard. Note moyenne, volume d'avis, tendance.",
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: FileText,
    title: 'Rapport hebdomadaire PDF',
    description: "Chaque semaine, recevez un rapport PDF complet directement dans Telegram avec l'évolution de votre réputation.",
    color: 'bg-emerald-100 text-emerald-700',
  },
  {
    icon: QrCode,
    title: 'Création de QR codes',
    description: "Créez et gérez vos QR codes directement depuis le bot. Le lien et le QR code vous sont envoyés instantanément.",
    color: 'bg-violet-100 text-violet-700',
  },
  {
    icon: Zap,
    title: 'Zéro configuration',
    description: "Une seule commande pour connecter votre compte. Pas d'application à installer, pas de mot de passe supplémentaire.",
    color: 'bg-sky-100 text-sky-700',
  },
];

const steps = [
  {
    number: '01',
    title: 'Ouvrez le bot',
    description: 'Cliquez sur le bouton ci-dessous pour ouvrir @Opinbasebot sur Telegram.',
  },
  {
    number: '02',
    title: 'Connectez votre compte',
    description: 'Envoyez la commande /connect et suivez les instructions pour lier votre espace Opinbase.',
  },
  {
    number: '03',
    title: 'Recevez vos avis',
    description: "C'est tout. Dès le prochain avis client, vous recevez une notification directement dans Telegram.",
  },
];

const commands = [
  { cmd: '/avis', label: 'Avis récents et filtres' },
  { cmd: '/create_qr', label: 'Création guidée de QR code' },
  { cmd: '/my_qr_codes', label: 'Liste des QR codes' },
  { cmd: '/ai', label: 'Analyse IA' },
  { cmd: '/settings', label: 'Préférences de notification' },
  { cmd: '/connect', label: 'Lier votre compte Opinbase' },
];
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <!-- Header -->
    <header class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="flex items-center" aria-label="Opinbase">
          <img :src="'/assets/logo_600_×_160.png'" alt="Opinbase" class="h-10 w-auto max-w-[160px] object-contain" />
        </RouterLink>
        <nav class="flex items-center gap-5 text-sm font-bold text-brand-700">
          <RouterLink to="/" class="hidden sm:inline">Accueil</RouterLink>
          <RouterLink to="/login">Connexion</RouterLink>
          <a
            :href="BOT_LINK"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-white transition hover:bg-brand-600"
          >
            <Send :size="15" />
            Ouvrir le bot
          </a>
        </nav>
      </div>
    </header>

    <!-- Hero -->
    <section class="mx-auto max-w-7xl px-4 pt-6 pb-12 sm:px-6 lg:px-8 lg:pt-10 lg:pb-16">
      <div class="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span class="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-2 text-sm font-black text-brand-700">
            <MessageCircle :size="16" />
            Bot Telegram officiel · @Opinbasebot
          </span>
          <h1 class="mt-5 text-5xl font-black leading-[1.05] text-ink sm:text-6xl">
            Vos avis clients directement dans Telegram.
          </h1>
          <p class="mt-6 text-xl font-semibold leading-8 text-slate-600">
            Ne manquez plus jamais un avis. Alertes en temps réel, statistiques à la demande, rapport hebdomadaire PDF
            — tout depuis Telegram, sans ouvrir votre navigateur.
          </p>
          <div class="mt-8 flex flex-wrap gap-4">
            <a
              :href="BOT_LINK"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-2 rounded-2xl bg-brand-700 px-7 py-4 text-lg font-black text-white shadow-lg shadow-emerald-900/10 transition hover:bg-brand-600"
            >
              <Send :size="20" />
              Accéder au bot
              <ArrowRight :size="18" />
            </a>
            <RouterLink
              to="/signup"
              class="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-7 py-4 text-lg font-black text-ink transition hover:border-brand-700 hover:text-brand-700"
            >
              Créer mon espace
            </RouterLink>
          </div>
          <p class="mt-5 text-sm font-semibold text-slate-500">Gratuit · Aucune installation · iOS et Android</p>
        </div>

        <!-- Screenshot 1 — menu principal -->
        <div class="w-full overflow-hidden rounded-3xl border border-slate-200 shadow-2xl shadow-slate-300/50">
          <img
            :src="'/bot/menu.png'"
            alt="Menu principal du bot Opinbase sur Telegram"
            class="w-full object-cover"
          />
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-12 text-center">
          <p class="mb-3 text-sm font-black uppercase tracking-wide text-brand-700">Ce que vous gagnez</p>
          <h2 class="text-4xl font-black text-ink sm:text-5xl">Tout ce que fait le bot pour vous.</h2>
          <p class="mx-auto mt-5 max-w-2xl text-lg font-semibold text-slate-500">
            Sans ouvrir de navigateur, sans chercher dans vos emails — vos avis et vos indicateurs à portée d'un message.
          </p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="rounded-2xl border border-slate-200 bg-slate-50 p-6 transition hover:border-brand-200 hover:shadow-md"
          >
            <span :class="['mb-4 inline-grid h-12 w-12 place-items-center rounded-2xl', feature.color]">
              <component :is="feature.icon" :size="22" />
            </span>
            <h3 class="text-xl font-black text-ink">{{ feature.title }}</h3>
            <p class="mt-2 text-base font-semibold leading-7 text-slate-600">{{ feature.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Notification showcase -->
    <section class="py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p class="mb-3 text-sm font-black uppercase tracking-wide text-brand-700">Alertes en temps réel</p>
            <h2 class="text-4xl font-black leading-tight text-ink sm:text-5xl">
              Un avis reçu à 22h ? Vous le savez à 22h.
            </h2>
            <p class="mt-6 text-lg font-semibold leading-8 text-slate-600">
              Le bot vous envoie immédiatement la note, le commentaire et le nom du QR code concerné. Vous pouvez
              archiver, ajouter une note ou un tag directement depuis Telegram sans ouvrir votre dashboard.
            </p>
            <ul class="mt-8 space-y-3">
              <li class="flex items-center gap-3 text-base font-bold text-ink">
                <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
                  <Bell :size="14" />
                </span>
                Notification à chaque nouvel avis
              </li>
              <li class="flex items-center gap-3 text-base font-bold text-ink">
                <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
                  <Star :size="14" />
                </span>
                Alerte prioritaire sous le seuil configuré
              </li>
              <li class="flex items-center gap-3 text-base font-bold text-ink">
                <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <FileText :size="14" />
                </span>
                Rapport PDF hebdomadaire automatique
              </li>
            </ul>
          </div>

          <!-- Screenshot 2 — nouvelle notification + rapport PDF -->
          <div class="w-full overflow-hidden rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/70">
            <img
              :src="'/bot/notification.png'"
              alt="Notification d'un nouvel avis et rapport PDF hebdomadaire dans Telegram"
              class="w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Reviews list showcase -->
    <section class="bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-12 lg:grid-cols-2">
          <!-- Screenshot 3 — liste des avis -->
          <div class="w-full overflow-hidden rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/70">
            <img
              :src="'/bot/reviews.png'"
              alt="Liste des avis récents dans le bot Telegram"
              class="w-full object-cover"
            />
          </div>

          <div>
            <p class="mb-3 text-sm font-black uppercase tracking-wide text-brand-700">Historique des avis</p>
            <h2 class="text-4xl font-black leading-tight text-ink sm:text-5xl">
              Relisez tous vos avis depuis Telegram.
            </h2>
            <p class="mt-6 text-lg font-semibold leading-8 text-slate-600">
              Consultez la liste paginée de vos avis avec la note, le commentaire, le QR code associé et la date. Filtrez
              et naviguez sans quitter Telegram.
            </p>
            <div class="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p class="mb-3 text-sm font-black uppercase tracking-wide text-slate-500">Informations affichées</p>
              <ul class="space-y-2 text-base font-semibold text-ink">
                <li class="flex items-center gap-2"><span class="text-brand-700">★</span> Note sur 5</li>
                <li class="flex items-center gap-2"><span class="text-brand-700">✓</span> QR code concerné</li>
                <li class="flex items-center gap-2"><span class="text-brand-700">✓</span> Commentaire du client</li>
                <li class="flex items-center gap-2"><span class="text-brand-700">✓</span> Date de l'avis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- QR code creation -->
    <section class="py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p class="mb-3 text-sm font-black uppercase tracking-wide text-brand-700">Gestion des QR codes</p>
            <h2 class="text-4xl font-black leading-tight text-ink sm:text-5xl">
              Créez vos QR codes sans ouvrir le dashboard.
            </h2>
            <p class="mt-6 text-lg font-semibold leading-8 text-slate-600">
              Depuis le bot, créez un nouveau QR code en quelques secondes. Vous recevez directement l'image, le lien
              de collecte et le statut des canaux de notification.
            </p>
          </div>

          <!-- Screenshot 4 — QR code créé via bot -->
          <div class="w-full overflow-hidden rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/70">
            <img
              :src="'/bot/qrcode.png'"
              alt="QR code créé et reçu directement via le bot Telegram"
              class="w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Commands section -->
    <section class="bg-white py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid items-center gap-12 lg:grid-cols-2">
          <!-- Screenshot 5 — aide / commandes -->
          <div class="w-full overflow-hidden rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/70">
            <img
              :src="'/bot/help.png'"
              alt="Liste des commandes disponibles dans le bot Opinbase"
              class="w-full object-cover"
            />
          </div>

          <div>
            <p class="mb-3 text-sm font-black uppercase tracking-wide text-brand-700">Commandes disponibles</p>
            <h2 class="text-4xl font-black leading-tight text-ink sm:text-5xl">
              Toutes les commandes utiles.
            </h2>
            <p class="mt-6 text-lg font-semibold leading-8 text-slate-600">
              Interrogez le bot à tout moment grâce aux commandes dédiées. Vos données vous accompagnent partout.
            </p>
            <div class="mt-8 grid gap-3 sm:grid-cols-2">
              <div
                v-for="cmd in commands"
                :key="cmd.cmd"
                class="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4"
              >
                <span class="font-mono text-sm font-black text-brand-700">{{ cmd.cmd }}</span>
                <p class="mt-1 text-sm font-semibold text-slate-600">{{ cmd.label }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="py-16 lg:py-24">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-12 text-center">
          <p class="mb-3 text-sm font-black uppercase tracking-wide text-brand-700">Mise en place</p>
          <h2 class="text-4xl font-black text-ink sm:text-5xl">Prêt en moins de 2 minutes.</h2>
        </div>

        <div class="grid gap-8 lg:grid-cols-3">
          <div
            v-for="step in steps"
            :key="step.number"
            class="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <span class="mb-5 block text-5xl font-black leading-none text-brand-100">{{ step.number }}</span>
            <h3 class="text-xl font-black text-ink">{{ step.title }}</h3>
            <p class="mt-2 text-base font-semibold leading-7 text-slate-600">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Banner -->
    <section class="bg-brand-700 py-16 lg:py-24">
      <div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 class="text-4xl font-black leading-tight text-white sm:text-5xl">
          Commencez à recevoir vos avis sur Telegram.
        </h2>
        <p class="mt-6 text-xl font-semibold text-brand-100">
          Gratuit. Sans installation. En moins de 2 minutes.
        </p>
        <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            :href="BOT_LINK"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-black text-brand-700 shadow-lg transition hover:bg-brand-50"
          >
            <Send :size="20" />
            Ouvrir @Opinbasebot
            <ArrowRight :size="18" />
          </a>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-slate-200 bg-white py-8">
      <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="flex items-center" aria-label="Opinbase">
          <img :src="'/assets/logo_600_×_160.png'" alt="Opinbase" class="h-8 w-auto max-w-[140px] object-contain" />
        </RouterLink>
        <div class="flex flex-wrap gap-5 text-sm font-bold text-slate-500">
          <RouterLink to="/" class="hover:text-brand-700">Accueil</RouterLink>
          <RouterLink to="/signup" class="hover:text-brand-700">Inscription</RouterLink>
          <RouterLink to="/login" class="hover:text-brand-700">Connexion</RouterLink>
          <a :href="BOT_LINK" target="_blank" rel="noopener noreferrer" class="hover:text-brand-700">@Opinbasebot</a>
        </div>
      </div>
    </footer>
  </div>
</template>
