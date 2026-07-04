<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Ban, Eye, KeyRound, LayoutDashboard, Mail, Power, QrCode, UserCircle, Users } from 'lucide-vue-next';
import { clearToken } from '../../api';
import { useAdmin, type AdminStats, type AdminUser, type InactiveUserItem, type PaginationMeta, type QrRequestsWithoutAccount } from '../../composables/useAdmin';
import AdminPageHeader from '../../components/admin/AdminPageHeader.vue';
import AdminSidebar from '../../components/admin/AdminSidebar.vue';
import BasePagination from '../../components/shared/BasePagination.vue';
import { adminContextKey } from '../../composables/useAdminContext';

type AdminTab = 'dashboard' | 'users' | 'qr-requests' | 'inactive' | 'notification-templates' | 'account';

const route = useRoute();
const router = useRouter();
const admin = useAdmin();

function getRouteTab(): AdminTab {
  const tab = route.path.split('/').filter(Boolean).pop();
  return navItems.some((item) => item.key === tab) ? tab as AdminTab : 'dashboard';
}

const activeTab = ref<AdminTab>('dashboard');
const stats = ref<AdminStats | null>(null);
const users = ref<AdminUser[]>([]);
const filterUsers = ref<AdminUser[]>([]);
const emptyPagination: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
const usersPagination = ref<PaginationMeta>(emptyPagination);
const qrRequests = ref<QrRequestsWithoutAccount>({ total: 0, companies: [], pagination: emptyPagination });
const inactiveUsers = ref<InactiveUserItem[]>([]);
const inactivePagination = ref<PaginationMeta>(emptyPagination);
const qrAccountFilter = ref<'all' | 'with' | 'without'>('all');
const usersSearch = ref('');
const qrSearch = ref('');
const pageSize = 10;
const usersPage = ref(1);
const qrPage = ref(1);
const inactivePage = ref(1);
const loading = ref(false);
const message = ref('');
let qrSearchDebounce: ReturnType<typeof setTimeout> | undefined;
let usersSearchDebounce: ReturnType<typeof setTimeout> | undefined;

const navItems: Array<{ key: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { key: 'users', label: 'Utilisateurs', icon: Users },
  { key: 'qr-requests', label: 'Demandes QR', icon: QrCode },
  { key: 'inactive', label: 'Inactifs', icon: Ban },
  { key: 'notification-templates', label: 'Modèles de notification', icon: Mail },
  { key: 'account', label: 'Mon compte', icon: UserCircle }
];

const pageTitle = computed(() => navItems.find((item) => item.key === activeTab.value)?.label || 'Admin');
activeTab.value = getRouteTab();
const usersTotalPages = computed(() => usersPagination.value.totalPages);
const qrTotalPages = computed(() => qrRequests.value.pagination.totalPages);
const inactiveTotalPages = computed(() => inactivePagination.value.totalPages);

async function goQrPage(page: number) {
  qrPage.value = Math.min(Math.max(page, 1), qrTotalPages.value);
  await loadQrRequests();
}

async function goUsersPage(page: number) {
  usersPage.value = Math.min(Math.max(page, 1), usersTotalPages.value);
  await loadUsers();
}

async function goInactivePage(page: number) {
  inactivePage.value = Math.min(Math.max(page, 1), inactiveTotalPages.value);
  await loadInactiveUsers();
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('fr-FR') : '-';
}

function setTab(tab: AdminTab) {
  activeTab.value = tab;
  router.push(`/admin/${tab}`);
}

async function loadQrRequests() {
  qrRequests.value = await admin.getQrRequestsWithoutAccount({
    page: qrPage.value,
    limit: pageSize,
    accountFilter: qrAccountFilter.value,
    search: qrSearch.value.trim() || undefined
  });
}

async function loadUsers() {
  const response = await admin.getUsers({
    page: usersPage.value,
    limit: pageSize,
    search: usersSearch.value.trim() || undefined
  });
  users.value = response.users;
  usersPagination.value = response.pagination;
}

async function loadInactiveUsers() {
  const response = await admin.getInactiveUsers({ page: inactivePage.value, limit: pageSize });
  inactiveUsers.value = response.users;
  inactivePagination.value = response.pagination;
}

async function load() {
  loading.value = true;
  message.value = '';
  try {
    const [statsResult, usersResult, qrRequestsResult, inactiveResult, filterUsersResult] = await Promise.all([
      admin.getStats(),
      admin.getUsers({ page: usersPage.value, limit: pageSize, search: usersSearch.value.trim() || undefined }),
      admin.getQrRequestsWithoutAccount({ page: qrPage.value, limit: pageSize, accountFilter: qrAccountFilter.value, search: qrSearch.value.trim() || undefined }),
      admin.getInactiveUsers({ page: inactivePage.value, limit: pageSize }),
      admin.getUsers({ page: 1, limit: 100 })
    ]);
    stats.value = statsResult;
    users.value = usersResult.users;
    usersPagination.value = usersResult.pagination;
    qrRequests.value = qrRequestsResult;
    inactiveUsers.value = inactiveResult.users;
    inactivePagination.value = inactiveResult.pagination;
    filterUsers.value = filterUsersResult.users;
  } catch (err) {
    message.value = err instanceof Error ? err.message : 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

async function resetPassword(user: AdminUser) {
  message.value = '';
  try {
    await admin.generatePassword(user._id);
    user.mustChangePassword = true;
    message.value = `Nouveau mot de passe envoye a ${user.email}.`;
  } catch (err) {
    message.value = err instanceof Error ? err.message : 'Erreur inconnue';
  }
}

async function toggleUser(user: AdminUser) {
  message.value = '';
  try {
    const result = await admin.setUserActive(user._id, !user.isActive);
    user.isActive = result.isActive;
    message.value = result.isActive ? 'Compte active.' : 'Compte desactive.';
  } catch (err) {
    message.value = err instanceof Error ? err.message : 'Erreur inconnue';
  }
}

function openUser(user: AdminUser) {
  router.push(`/admin/user/${user._id}`);
}

function logout() {
  clearToken();
  window.location.href = '/login';
}

watch(() => route.path, () => {
  activeTab.value = getRouteTab();
});

watch(qrAccountFilter, () => {
  qrPage.value = 1;
  loadQrRequests();
});

watch(qrSearch, () => {
  if (qrSearchDebounce) clearTimeout(qrSearchDebounce);
  qrSearchDebounce = setTimeout(() => {
    qrPage.value = 1;
    loadQrRequests();
  }, 450);
});

watch(usersSearch, () => {
  if (usersSearchDebounce) clearTimeout(usersSearchDebounce);
  usersSearchDebounce = setTimeout(() => {
    usersPage.value = 1;
    loadUsers();
  }, 450);
});

provide(adminContextKey, { Ban, Eye, KeyRound, LayoutDashboard, Mail, Power, QrCode, Users, AdminPageHeader, AdminSidebar, BasePagination, route, router, admin, activeTab, stats, users, filterUsers, usersPagination, qrRequests, inactiveUsers, inactivePagination, qrAccountFilter, usersSearch, qrSearch, usersPage, qrPage, inactivePage, loading, message, navItems, pageTitle, usersTotalPages, qrTotalPages, inactiveTotalPages, goQrPage, goUsersPage, goInactivePage, formatDate, setTab, loadQrRequests, loadUsers, loadInactiveUsers, load, resetPassword, toggleUser, openUser, logout });

onMounted(() => {
  activeTab.value = getRouteTab();
  load();
});

onBeforeUnmount(() => {
  if (qrSearchDebounce) clearTimeout(qrSearchDebounce);
  if (usersSearchDebounce) clearTimeout(usersSearchDebounce);
});
</script>

<template>
  <main class="min-h-screen bg-slate-100 lg:grid lg:grid-cols-[312px_1fr]">
    <AdminSidebar :active-tab="activeTab" :nav-items="navItems" @select="setTab($event as AdminTab)" @logout="logout" />

    <section class="min-w-0 lg:col-start-2">
      <AdminPageHeader :title="pageTitle" :loading="loading" @refresh="load" />

      <div class="m-4 lg:m-6">
        <p v-if="message" class="mb-5 rounded-xl px-4 py-3 text-sm font-bold" :class="message.includes('Erreur') || message.includes('requis') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ message }}</p>

        <RouterView />
      </div>
    </section>
  </main>
</template>
