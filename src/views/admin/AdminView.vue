<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Ban, Eye, KeyRound, LayoutDashboard, Power, QrCode, ReceiptText, Users } from 'lucide-vue-next';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { clearToken } from '../../api';
import { useAdmin, type AdminStats, type AdminUser, type InactiveUserItem, type PaginationMeta, type QrRequestsWithoutAccount, type TransactionsResponse } from '../../composables/useAdmin';
import AdminPageHeader from '../../components/admin/AdminPageHeader.vue';
import AdminSidebar from '../../components/admin/AdminSidebar.vue';
import TransactionTable from '../../components/admin/AdminTransactionTable.vue';
import BasePagination from '../../components/shared/BasePagination.vue';

type AdminTab = 'dashboard' | 'users' | 'qr-requests' | 'transactions' | 'inactive';

const route = useRoute();
const router = useRouter();
const admin = useAdmin();

const activeTab = ref<AdminTab>((route.params.tab as AdminTab) || 'dashboard');
const stats = ref<AdminStats | null>(null);
const users = ref<AdminUser[]>([]);
const filterUsers = ref<AdminUser[]>([]);
const emptyPagination: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
const usersPagination = ref<PaginationMeta>(emptyPagination);
const qrRequests = ref<QrRequestsWithoutAccount>({ total: 0, companies: [], pagination: emptyPagination });
const transactions = ref<TransactionsResponse>({ totalRevenueFcfa: 0, transactions: [], pagination: emptyPagination });
const inactiveUsers = ref<InactiveUserItem[]>([]);
const inactivePagination = ref<PaginationMeta>(emptyPagination);
const filters = ref<{ userId: string; dateRange: Date[] | null }>({ userId: '', dateRange: null });
const qrAccountFilter = ref<'all' | 'with' | 'without'>('all');
const usersSearch = ref('');
const qrSearch = ref('');
const pageSize = 10;
const usersPage = ref(1);
const qrPage = ref(1);
const transactionPage = ref(1);
const inactivePage = ref(1);
const loading = ref(false);
const message = ref('');
let qrSearchDebounce: ReturnType<typeof setTimeout> | undefined;
let usersSearchDebounce: ReturnType<typeof setTimeout> | undefined;

const navItems: Array<{ key: AdminTab; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { key: 'users', label: 'Utilisateurs', icon: Users },
  { key: 'qr-requests', label: 'Demandes QR', icon: QrCode },
  { key: 'transactions', label: 'Transactions', icon: ReceiptText },
  { key: 'inactive', label: 'Inactifs', icon: Ban }
];

const pageTitle = computed(() => navItems.find((item) => item.key === activeTab.value)?.label || 'Admin');
const usersTotalPages = computed(() => usersPagination.value.totalPages);
const qrTotalPages = computed(() => qrRequests.value.pagination.totalPages);
const transactionTotalPages = computed(() => transactions.value.pagination.totalPages);
const inactiveTotalPages = computed(() => inactivePagination.value.totalPages);

async function goQrPage(page: number) {
  qrPage.value = Math.min(Math.max(page, 1), qrTotalPages.value);
  await loadQrRequests();
}

async function goUsersPage(page: number) {
  usersPage.value = Math.min(Math.max(page, 1), usersTotalPages.value);
  await loadUsers();
}

async function goTransactionPage(page: number) {
  transactionPage.value = Math.min(Math.max(page, 1), transactionTotalPages.value);
  await loadTransactions();
}

async function goInactivePage(page: number) {
  inactivePage.value = Math.min(Math.max(page, 1), inactiveTotalPages.value);
  await loadInactiveUsers();
}

function formatMoney(value = 0) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value);
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('fr-FR') : '-';
}

function formatFilterDate(value?: Date) {
  if (!value) return undefined;
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateRangeFilter() {
  const range = filters.value.dateRange || [];
  return {
    startDate: formatFilterDate(range[0]),
    endDate: formatFilterDate(range[1])
  };
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

async function loadTransactions() {
  const range = getDateRangeFilter();
  transactions.value = await admin.getTransactions({
    userId: filters.value.userId || undefined,
    startDate: range.startDate,
    endDate: range.endDate,
    page: transactionPage.value,
    limit: pageSize
  });
}

async function applyTransactionFilters() {
  transactionPage.value = 1;
  await loadTransactions();
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
    const [statsResult, usersResult, qrRequestsResult, transactionsResult, inactiveResult, filterUsersResult] = await Promise.all([
      admin.getStats(),
      admin.getUsers({ page: usersPage.value, limit: pageSize, search: usersSearch.value.trim() || undefined }),
      admin.getQrRequestsWithoutAccount({ page: qrPage.value, limit: pageSize, accountFilter: qrAccountFilter.value, search: qrSearch.value.trim() || undefined }),
      admin.getTransactions({ page: transactionPage.value, limit: pageSize }),
      admin.getInactiveUsers({ page: inactivePage.value, limit: pageSize }),
      admin.getUsers({ page: 1, limit: 100 })
    ]);
    stats.value = statsResult;
    users.value = usersResult.users;
    usersPagination.value = usersResult.pagination;
    qrRequests.value = qrRequestsResult;
    transactions.value = transactionsResult;
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

watch(() => route.params.tab, (tab) => {
  if (navItems.some((item) => item.key === tab)) activeTab.value = tab as AdminTab;
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

onMounted(() => {
  if (!route.params.tab) router.replace('/admin/dashboard');
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

      <div class="m-4 rounded-3xl bg-white p-5 shadow-sm lg:m-6 lg:p-8">
        <p v-if="message" class="mb-5 rounded-xl px-4 py-3 text-sm font-bold" :class="message.includes('Erreur') || message.includes('requis') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'">{{ message }}</p>

        <section v-if="activeTab === 'dashboard'" class="grid gap-6">
          <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article class="rounded-2xl bg-sky-50 p-6"><p class="font-bold text-black">Avis generes</p><strong class="mt-2 block text-4xl font-black text-black">{{ stats?.totalReviews || 0 }}</strong></article>
            <article class="rounded-2xl bg-emerald-50 p-6"><p class="font-bold text-black">QR Code generes</p><strong class="mt-2 block text-4xl font-black text-black">{{ stats?.totalQrCodes || 0 }}</strong></article>
            <article class="rounded-2xl bg-amber-50 p-6"><p class="font-bold text-black">Comptes utilisateurs</p><strong class="mt-2 block text-4xl font-black text-black">{{ stats?.totalUsers || 0 }}</strong></article>
            <article class="rounded-2xl bg-rose-50 p-6"><p class="font-bold text-black">Revenus totaux</p><strong class="mt-2 block text-3xl font-black text-black">{{ formatMoney(stats?.totalRevenueFcfa) }}</strong></article>
          </div>
          <div class="grid gap-6 xl:grid-cols-2">
            <TransactionTable title="15 dernieres transactions" :transactions="stats?.latestTransactions || []" />
            <div class="rounded-2xl border border-slate-200 p-5">
              <h2 class="mb-4 text-xl font-black text-ink">20 meilleurs payeurs</h2>
              <div class="grid gap-3">
                <div v-for="payer in stats?.topPayers || []" :key="payer.company._id" class="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <span><strong class="block text-ink">{{ payer.company.name }}</strong><span class="text-sm font-semibold text-slate-500">{{ payer.paymentsCount }} paiement(s)</span></span>
                  <span class="font-black text-brand-700">{{ formatMoney(payer.amount) }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'users'">
          <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 class="text-2xl font-black text-ink">Utilisateurs</h2>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600">{{ usersPagination.total }} comptes</span>
          </div>
          <input v-model="usersSearch" placeholder="Rechercher par entreprise ou email" class="mb-4 h-12 w-full rounded-xl border border-slate-300 px-4 font-bold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100 xl:max-w-lg" />
          <div class="overflow-x-auto rounded-2xl border border-slate-300">
            <table class="min-w-[1120px] w-full border-collapse text-left">
              <thead class="bg-slate-50"><tr><th class="px-5 py-4 text-sm font-black text-black">Entreprise</th><th class="px-5 py-4 text-sm font-black text-black">Email</th><th class="px-5 py-4 text-sm font-black text-black">Credits restants</th><th class="px-5 py-4 text-sm font-black text-black">Avis recoltes</th><th class="px-5 py-4 text-sm font-black text-black">Statut</th><th class="px-5 py-4 text-sm font-black text-black">Actions</th></tr></thead>
              <tbody>
                <tr v-for="user in users" :key="user._id" class="border-t border-slate-200">
                  <td class="px-5 py-4 font-black text-ink">{{ user.company?.name || '-' }}</td>
                  <td class="px-5 py-4 font-semibold text-slate-600">{{ user.email }}</td>
                  <td class="px-5 py-4 font-black text-brand-700">{{ user.remainingCredits || 0 }}</td>
                  <td class="px-5 py-4 font-black text-ink">{{ user.reviewsCount || 0 }}</td>
                  <td class="px-5 py-4"><span class="rounded-full px-3 py-1 text-sm font-black" :class="user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ user.isActive ? 'Actif' : 'Desactive' }}</span></td>
                  <td class="px-5 py-4">
                    <div class="flex flex-wrap gap-2">
                      <button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-ink" title="Voir" @click="openUser(user)"><Eye :size="17" /></button>
                      <button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-ink transition hover:bg-slate-100" title="Generer un mot de passe" aria-label="Generer un mot de passe" @click="resetPassword(user)"><KeyRound :size="17" /></button>
                      <button class="grid h-10 w-10 place-items-center rounded-xl text-white transition" :class="user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-700 hover:bg-brand-600'" :title="user.isActive ? 'Desactiver' : 'Activer'" :aria-label="user.isActive ? 'Desactiver' : 'Activer'" @click="toggleUser(user)"><Power :size="17" /></button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!users.length">
                  <td colspan="6" class="px-5 py-10 text-center font-bold text-slate-500">Aucun utilisateur.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <BasePagination :pagination="usersPagination" :page="usersPage" label="utilisateur(s) au total" @page-change="goUsersPage" />
        </section>

        <section v-if="activeTab === 'qr-requests'">
          <div class="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 class="text-2xl font-black text-ink">Demandes QR</h2>
              <p class="mt-1 text-sm font-bold text-slate-500">Total selon le filtre actif / total global</p>
            </div>
            <div class="inline-flex w-fit rounded-xl border border-slate-300 bg-white p-1">
              <button class="h-10 rounded-lg px-4 text-sm font-black" :class="qrAccountFilter === 'all' ? 'bg-brand-700 text-white' : 'text-slate-600'" @click="qrAccountFilter = 'all'">Tous</button>
              <button class="h-10 rounded-lg px-4 text-sm font-black" :class="qrAccountFilter === 'with' ? 'bg-brand-700 text-white' : 'text-slate-600'" @click="qrAccountFilter = 'with'">Avec compte</button>
              <button class="h-10 rounded-lg px-4 text-sm font-black" :class="qrAccountFilter === 'without' ? 'bg-brand-700 text-white' : 'text-slate-600'" @click="qrAccountFilter = 'without'">Sans compte</button>
            </div>
          </div>
          <input v-model="qrSearch" placeholder="Rechercher par nom, email, telephone" class="mb-4 h-12 w-full rounded-xl border border-slate-300 px-4 font-bold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100 xl:max-w-lg" />
          <div class="overflow-x-auto rounded-2xl border border-slate-300">
            <table class="min-w-[1040px] w-full text-left"><thead class="bg-slate-50"><tr><th class="px-5 py-4 font-black">Entreprise</th><th class="px-5 py-4 font-black">Email</th><th class="px-5 py-4 font-black">WhatsApp</th><th class="px-5 py-4 font-black">Compte</th><th class="px-5 py-4 font-black">Date demande</th><th class="px-5 py-4 font-black">Action</th></tr></thead>
              <tbody>
                <tr v-for="company in qrRequests.companies" :key="company._id" class="border-t border-slate-200">
                  <td class="px-5 py-4 font-black">{{ company.name }}</td>
                  <td class="px-5 py-4">{{ company.email }}</td>
                  <td class="px-5 py-4">{{ company.whatsappNumber || '-' }}</td>
                  <td class="px-5 py-4"><span class="rounded-full px-3 py-1 text-sm font-black" :class="company.hasAccount ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">{{ company.hasAccount ? 'Avec compte' : 'Sans compte' }}</span></td>
                  <td class="px-5 py-4">{{ formatDate(company.createdAt) }}</td>
                  <td class="px-5 py-4">
                    <button v-if="company.userId" class="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-ink transition hover:bg-slate-100" title="Voir le detail" aria-label="Voir le detail" @click="router.push(`/admin/user/${company.userId}`)">
                      <Eye :size="17" />
                    </button>
                    <span v-else class="text-slate-400">-</span>
                  </td>
                </tr>
                <tr v-if="!qrRequests.companies.length">
                  <td colspan="6" class="px-5 py-10 text-center font-bold text-slate-500">Aucune demande QR ne correspond au filtre.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <BasePagination :pagination="qrRequests.pagination" :page="qrPage" label="demande(s) trouvee(s)" @page-change="goQrPage" />
        </section>

        <section v-if="activeTab === 'transactions'" class="grid gap-5">
          <div class="grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-[1fr_1fr_auto]">
            <select v-model="filters.userId" class="h-12 rounded-xl border border-slate-300 px-3 font-bold"><option value="">Tous les utilisateurs</option><option v-for="user in filterUsers" :key="user._id" :value="user._id">{{ user.company?.name || user.email }}</option></select>
            <VueDatePicker
              v-model="filters.dateRange"
              range
              multi-calendars
              format="dd/MM/yyyy"
              placeholder="Selectionner une periode"
              :enable-time-picker="false"
              auto-apply
            />
            <button class="h-12 rounded-xl bg-brand-700 px-5 font-black text-white" @click="applyTransactionFilters">Filtrer</button>
          </div>
          <div class="rounded-2xl bg-emerald-50 p-5"><p class="font-bold text-black">Montant genere selon le filtre actif</p><strong class="mt-1 block text-3xl font-black text-black">{{ formatMoney(transactions.totalRevenueFcfa) }}</strong><span class="mt-1 block text-sm font-bold text-slate-600">{{ transactions.pagination.total }} transaction(s)</span></div>
          <div class="overflow-x-auto rounded-2xl border border-slate-300">
            <table class="min-w-[900px] w-full text-left">
              <thead class="bg-slate-50">
                <tr>
                  <th class="px-5 py-4 font-black">Date paiement</th>
                  <th class="px-5 py-4 font-black">Montant paye</th>
                  <th class="px-5 py-4 font-black">Plan</th>
                  <th class="px-5 py-4 font-black">Statut</th>
                  <th class="px-5 py-4 font-black">Utilisateur</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="payment in transactions.transactions" :key="payment._id" class="border-t border-slate-200">
                  <td class="px-5 py-4 font-semibold text-slate-600">{{ formatDate(payment.paidAt || payment.createdAt) }}</td>
                  <td class="px-5 py-4 font-black text-brand-700">{{ formatMoney(payment.amountFcfa) }}</td>
                  <td class="px-5 py-4 font-black text-ink">{{ payment.planLabel }}</td>
                  <td class="px-5 py-4"><span class="rounded-full px-3 py-1 text-sm font-black" :class="payment.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : payment.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'">{{ payment.status }}</span></td>
                  <td class="px-5 py-4 font-semibold text-slate-600">{{ payment.company?.name || payment.company?.email || '-' }}</td>
                </tr>
                <tr v-if="!transactions.transactions.length">
                  <td colspan="5" class="px-5 py-10 text-center font-bold text-slate-500">Aucune transaction pour le filtre actif.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <BasePagination :pagination="transactions.pagination" :page="transactionPage" label="transaction(s) trouvee(s)" @page-change="goTransactionPage" />
        </section>

        <section v-if="activeTab === 'inactive'">
          <h2 class="mb-4 text-2xl font-black text-ink">Utilisateurs inactifs ({{ inactivePagination.total }})</h2>
          <div class="grid gap-3">
            <article v-for="item in inactiveUsers" :key="item.user._id" class="rounded-2xl border border-slate-200 p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <span>
                  <strong class="block text-ink">{{ item.company?.name || item.user.email }}</strong>
                  <span class="text-sm font-semibold text-slate-500">{{ item.reason }}</span>
                  <span v-if="item.lastUsedAt" class="mt-1 block text-xs font-bold text-slate-400">Derniere utilisation: {{ formatDate(item.lastUsedAt) }}</span>
                </span>
                <span class="font-black text-brand-700">{{ formatMoney(item.revenueFcfa) }}</span>
              </div>
            </article>
          </div>
          <BasePagination :pagination="inactivePagination" :page="inactivePage" label="utilisateur(s) inactif(s)" @page-change="goInactivePage" />
        </section>
      </div>
    </section>
  </main>
</template>
