<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Mail, MessageCircle, QrCode, ShieldCheck } from 'lucide-vue-next';
import { useAuth, type LoginInput } from '../../composables/useAuth';
import { loginSchema, otpSchema, validateForm, type FormErrors } from '../../validators/auth.validator';
import PasswordField from '../../components/PasswordField.vue';

type OtpForm = { code: string };

const router = useRouter();
const route = useRoute();
const { login, verifyOtp, resendOtp: resendOtpRequest } = useAuth();
const form = ref<LoginInput>({ email: '', password: '' });
const otpForm = ref<OtpForm>({ code: '' });
const errors = ref<FormErrors<LoginInput>>({});
const otpErrors = ref<FormErrors<OtpForm>>({});
const toast = ref('');
const loading = ref(false);
const otpStep = ref(false);
const otpPurpose = ref<'signup' | 'login'>('signup');

function goDashboard(roleId?: string) {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '';
  if (roleId === 'superadministrateur') {
    router.push(redirect.startsWith('/admin') ? redirect : '/admin');
    return;
  }

  router.push(redirect && !redirect.startsWith('/admin') ? redirect : '/dashboard');
}

async function submit() {
  toast.value = '';
  errors.value = await validateForm(loginSchema, form.value);
  if (Object.keys(errors.value).length) return;

  loading.value = true;
  try {
    const response = await login(form.value);
    if (response.requiresOtp) {
      otpStep.value = true;
      otpPurpose.value = response.purpose === 'login' ? 'login' : 'signup';
      toast.value = 'Un code OTP a été envoyé à votre email.';
      return;
    }
    toast.value = 'Connexion réussie.';
    goDashboard(response.user?.roleId);
  } catch (err) {
    toast.value = err instanceof Error ? err.message : 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}


async function submitOtp() {
  toast.value = '';
  otpErrors.value = await validateForm(otpSchema, otpForm.value);
  if (Object.keys(otpErrors.value).length) return;

  loading.value = true;
  try {
    const response = await verifyOtp(form.value.email, otpForm.value.code, otpPurpose.value);
    if ('user' in response) goDashboard(response.user?.roleId);
    else goDashboard();
  } catch (err) {
    toast.value = err instanceof Error ? err.message : 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

async function resendOtp() {
  toast.value = '';
  loading.value = true;
  otpForm.value.code = '';
  try {
    const response = await resendOtpRequest(form.value.email, otpPurpose.value);
    otpPurpose.value = response.purpose === 'login' ? 'login' : 'signup';
    toast.value = 'Un code OTP a été envoyé à votre email.';
  } catch (err) {
    toast.value = err instanceof Error ? err.message : 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100">
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
          <RouterLink to="/signup">Créer un compte</RouterLink>
        </nav>
      </div>
    </header>
    <main class="grid place-items-center px-4 py-10">
    <section class="w-full max-w-3xl">
      <div class="rounded-3xl bg-white px-6 py-10 shadow-xl shadow-slate-200 sm:px-16 sm:py-14">
        <div class="mx-auto max-w-xl text-center">
          <h1 class="text-4xl font-black leading-tight text-ink sm:text-5xl">{{ otpStep ? 'Vérification OTP' : 'Connectez-vous à votre compte' }}</h1>
          <p class="mt-4 text-base font-semibold text-slate-500">
            Vous n'avez pas de compte ?
            <RouterLink to="/signup" class="font-black text-brand-700">Créez-en un</RouterLink>
          </p>
        </div>

        <form v-if="!otpStep" class="mx-auto mt-10 max-w-xl space-y-5" @submit.prevent="submit">
          <label class="block">
            <span class="relative block">
              <Mail :size="22" class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input v-model="form.email" type="email" placeholder="Email address" class="h-16 w-full rounded-xl border border-slate-300 bg-white pl-14 pr-4 text-base font-semibold outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
            </span>
            <span v-if="errors.email" class="mt-2 block text-sm font-bold text-red-600">{{ errors.email }}</span>
          </label>
          <label class="block">
            <PasswordField v-model="form.password" placeholder="Mot de passe" />
            <span v-if="errors.password" class="mt-2 block text-sm font-bold text-red-600">{{ errors.password }}</span>
          </label>
          <div class="text-right">
            <RouterLink to="/forgot-password" class="text-sm font-black text-brand-700">Mot de passe oublié ?</RouterLink>
          </div>
          <button class="h-16 w-full rounded-xl bg-brand-700 text-lg font-black text-white transition hover:bg-brand-600 disabled:opacity-60" :disabled="loading">
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <form v-else class="mx-auto mt-10 max-w-xl space-y-5" @submit.prevent="submitOtp">
          <label class="block">
            <span class="relative block">
              <ShieldCheck :size="22" class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input v-model="otpForm.code" inputmode="numeric" maxlength="6" placeholder="Code OTP" class="h-16 w-full rounded-xl border border-slate-300 bg-white pl-14 pr-4 text-base font-semibold outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
            </span>
            <span v-if="otpErrors.code" class="mt-2 block text-sm font-bold text-red-600">{{ otpErrors.code }}</span>
          </label>
          <button class="h-16 w-full rounded-xl bg-brand-700 text-lg font-black text-white transition hover:bg-brand-600 disabled:opacity-60" :disabled="loading">
            {{ loading ? 'Vérification...' : 'Vérifier et se connecter' }}
          </button>
          <button type="button" class="w-full text-sm font-black text-brand-700 disabled:opacity-50" :disabled="loading" @click="resendOtp">
            Renvoyer le code
          </button>
        </form>

        <p v-if="toast" class="mx-auto mt-6 max-w-xl rounded-xl px-4 py-3 text-sm font-bold" :class="toast.includes('réussie') || toast.includes('envoyé') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ toast }}</p>
      </div>
    </section>
    </main>
  </div>
</template>
