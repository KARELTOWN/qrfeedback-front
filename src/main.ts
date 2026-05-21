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
import { getToken } from './api';

const dashboardTabs = ['dashboard', 'reviews', 'qrcodes', 'ai', 'settings'];
const adminTabs = ['dashboard', 'users', 'qr-requests', 'transactions', 'inactive'];

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/avis/:slug', component: FeedbackView },
    { path: '/login', component: LoginView },
    { path: '/signup', component: SignupView },
    { path: '/forgot-password', component: ForgotPasswordView },
    { path: '/dashboard', redirect: '/dashboard/dashboard' },
    { path: '/dashboard/:tab', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/admin', redirect: '/admin/dashboard' },
    { path: '/admin/user/:userId', component: AdminUserDetailView, meta: { requiresAuth: true } },
    { path: '/admin/:tab', component: AdminView, meta: { requiresAuth: true } },
    { path: '/paiement/retour', component: PaymentReturnView },
    { path: '/paiement/:slug?', component: PaymentView },
    { path: '/reset-password', component: ResetPasswordView }
  ]
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !getToken()) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  if (to.path.startsWith('/dashboard/') && !dashboardTabs.includes(String(to.params.tab))) {
    return '/dashboard/dashboard';
  }

  if (to.path.startsWith('/admin/') && !to.path.startsWith('/admin/user/') && !adminTabs.includes(String(to.params.tab))) {
    return '/admin/dashboard';
  }
});

createApp(App).use(router).mount('#app');
