<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { Bot, Home, MessageSquareText, QrCode, Settings } from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth';
import { useDashboard, type DashboardStats } from '../../composables/useDashboard';
import ToastHost from '../../components/shared/ToastHost.vue';
import UserPageHeader from '../../components/user/UserPageHeader.vue';
import UserSidebar from '../../components/user/UserSidebar.vue';

type DashboardRoute = 'dashboard' | 'reviews' | 'qrcodes' | 'ai' | 'settings';

const route = useRoute();
const { logout: clearSession } = useAuth();
const { getStats } = useDashboard();

const stats = ref<DashboardStats | null>(null);
const error = ref('');
const pageRefreshKey = ref(0);
const mobileMenuOpen = ref(false);

const navItems: Array<{ key: DashboardRoute; label: string; icon: typeof Home; to: string }> = [
  { key: 'dashboard', label: 'Tableau de bord', icon: Home, to: '/dashboard' },
  { key: 'reviews', label: 'Avis clients', icon: MessageSquareText, to: '/reviews' },
  { key: 'qrcodes', label: 'QR Code', icon: QrCode, to: '/qrcodes' },
  { key: 'ai', label: 'Analyse IA', icon: Bot, to: '/ai' },
  { key: 'settings', label: 'Réglages', icon: Settings, to: '/settings' }
];

const activePage = computed(() => {
  const segment = route.path.split('/').filter(Boolean).pop();
  return navItems.some((item) => item.key === segment) ? segment as DashboardRoute : 'dashboard';
});

const pageTitle = computed(() => navItems.find((item) => item.key === activePage.value)?.label || 'Tableau de bord');

async function loadShell() {
  error.value = '';
  try {
    stats.value = await getStats();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur inconnue';
  }
}

async function refreshPage() {
  pageRefreshKey.value += 1;
  await loadShell();
}

function logout() {
  clearSession();
  window.location.href = '/login';
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
}

onMounted(loadShell);
</script>

<template>
  <main class="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[336px_1fr]">
    <UserSidebar :active-page="activePage" :company-name="stats?.company?.name || 'Entreprise'" :nav-items="navItems" @logout="logout" />

    <section class="min-w-0 lg:col-start-2 lg:h-screen lg:overflow-y-auto">
      <UserPageHeader :title="pageTitle" @menu="mobileMenuOpen = true" @refresh="refreshPage" />

      <div class="m-4 lg:m-6">
        <p v-if="error" class="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{{ error }}</p>
        <RouterView :key="`${route.fullPath}-${pageRefreshKey}`" />
      </div>
    </section>

    <div v-if="mobileMenuOpen" class="fixed inset-0 z-50 lg:hidden">
      <button class="absolute inset-0 h-full w-full bg-black/40" aria-label="Fermer le menu" @click="closeMobileMenu"></button>
      <div class="relative h-full max-w-[86vw] shadow-2xl">
        <UserSidebar mode="mobile" :active-page="activePage" :company-name="stats?.company?.name || 'Entreprise'" :nav-items="navItems" @navigate="closeMobileMenu" @logout="logout" />
      </div>
    </div>

    <ToastHost />
  </main>
</template>
