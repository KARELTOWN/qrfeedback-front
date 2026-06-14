import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import './styles.css';
import HomeView from './views/public/HomeView.vue';
import FeedbackView from './views/public/FeedbackView.vue';
import LoginView from './views/auth/LoginView.vue';
import DashboardView from './views/user/DashboardView.vue';
import PaymentView from './views/user/PaymentView.vue';
import PaymentReturnView from './views/user/PaymentReturnView.vue';
import ResetPasswordView from './views/auth/ResetPasswordView.vue';
import ForgotPasswordView from './views/auth/ForgotPasswordView.vue';
import SignupView from './views/auth/SignupView.vue';
import AdminView from './views/admin/AdminView.vue';
import AdminUserDetailView from './views/admin/AdminUserDetailView.vue';
import UserDashboardHomeView from './views/user/UserDashboardHomeView.vue';
import UserReviewsView from './views/user/UserReviewsView.vue';
import UserQrCodesView from './views/user/UserQrCodesView.vue';
import UserAiAnalysisView from './views/user/UserAiAnalysisView.vue';
import UserSettingsView from './views/user/UserSettingsView.vue';
import AdminDashboardView from './views/admin/AdminDashboardView.vue';
import AdminUsersView from './views/admin/AdminUsersView.vue';
import AdminQrRequestsView from './views/admin/AdminQrRequestsView.vue';
import AdminTransactionsView from './views/admin/AdminTransactionsView.vue';
import AdminInactiveUsersView from './views/admin/AdminInactiveUsersView.vue';
import { getToken } from './api';

const adminTabs = ['dashboard', 'users', 'qr-requests', 'transactions', 'inactive'];

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/avis/:slug', component: FeedbackView },
    { path: '/login', component: LoginView },
    { path: '/signup', component: SignupView },
    { path: '/forgot-password', component: ForgotPasswordView },
    {
      path: '/',
      component: DashboardView,
      meta: { requiresAuth: true },
      children: [
        { path: '/dashboard', component: UserDashboardHomeView },
        { path: '/reviews', component: UserReviewsView },
        { path: '/qrcodes', component: UserQrCodesView },
        { path: '/ai', component: UserAiAnalysisView },
        { path: '/settings', component: UserSettingsView }
      ]
    },    {
      path: '/admin',
      component: AdminView,
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', component: AdminDashboardView },
        { path: 'users', component: AdminUsersView },
        { path: 'qr-requests', component: AdminQrRequestsView },
        { path: 'transactions', component: AdminTransactionsView },
        { path: 'inactive', component: AdminInactiveUsersView }
      ]
    },
    { path: '/admin/user/:userId', component: AdminUserDetailView, meta: { requiresAuth: true } },
    { path: '/paiement/retour', component: PaymentReturnView },
    { path: '/paiement/:slug?', component: PaymentView },
    { path: '/reset-password', component: ResetPasswordView }
  ]
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getToken()) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  if (to.path.startsWith('/admin/') && !to.path.startsWith('/admin/user/') && !adminTabs.includes(String(to.path.split('/').filter(Boolean).pop()))) {
    return '/admin/dashboard';
  }
});

createApp(App).use(router).mount('#app');