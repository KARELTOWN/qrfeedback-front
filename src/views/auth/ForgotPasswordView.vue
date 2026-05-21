<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Mail, QrCode, ShieldCheck } from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth';
import PasswordField from '../../components/PasswordField.vue';
import {
  forgotPasswordConfirmSchema,
  forgotPasswordSchema,
  validateForm,
  type FormErrors
} from '../../validators/auth.validator';

type ForgotForm = { email: string };
type ConfirmForm = { code: string; password: string; confirmPassword: string };

const route = useRoute();
const router = useRouter();
const { forgotPassword, resetPasswordWithOtp, resendOtp: resendOtpRequest } = useAuth();
const form = ref<ForgotForm>({ email: '' });
const confirmForm = ref<ConfirmForm>({ code: '', password: '', confirmPassword: '' });
const errors = ref<FormErrors<ForgotForm>>({});
const confirmErrors = ref<FormErrors<ConfirmForm>>({});
const toast = ref('');
const loading = ref(false);
const codeStep = ref(false);

function firstQueryValue(value: unknown) {
  if (Array.isArray(value)) return value[0] ? String(value[0]) : '';
  return value ? String(value) : '';
}

function resetForms() {
  form.value = { email: '' };
  confirmForm.value = { code: '', password: '', confirmPassword: '' };
  errors.value = {};
  confirmErrors.value = {};
  codeStep.value = false;
}

async function submit() {
  toast.value = '';
  errors.value = await validateForm(forgotPasswordSchema, form.value);
  if (Object.keys(errors.value).length) return;

  loading.value = true;
  try {
    await forgotPassword(form.value.email);
    codeStep.value = true;
    toast.value = 'Un code OTP a été envoyé à votre email.';
  } catch (err) {
    toast.value = err instanceof Error ? err.message : 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

async function submitNewPassword() {
  toast.value = '';
  confirmErrors.value = await validateForm(forgotPasswordConfirmSchema, confirmForm.value);
  if (Object.keys(confirmErrors.value).length) return;

  loading.value = true;
  try {
    await resetPasswordWithOtp(form.value.email, confirmForm.value.code, confirmForm.value.password);
    toast.value = 'Mot de passe modifié. Vous pouvez vous connecter.';
    resetForms();
    window.setTimeout(() => router.push('/login'), 800);
  } catch (err) {
    toast.value = err instanceof Error ? err.message : 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

async function resendOtp() {
  toast.value = '';
  loading.value = true;
  confirmForm.value.code = '';
  try {
    await resendOtpRequest(form.value.email, 'reset-password');
    toast.value = 'Un code OTP a été envoyé à votre email.';
  } catch (err) {
    toast.value = err instanceof Error ? err.message : 'Erreur inconnue';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const email = firstQueryValue(route.query.email);
  const step = firstQueryValue(route.query.step);

  if (email) {
    form.value.email = email;
  }

  if (email && step === 'code') {
    codeStep.value = true;
  }
});
</script>

<template>
  <main class="grid min-h-screen place-items-center bg-slate-100 px-4 py-10">
    <section class="w-full max-w-2xl rounded-3xl bg-white px-6 py-10 shadow-xl shadow-slate-200 sm:px-14">
      <RouterLink to="/" class="mx-auto mb-8 flex w-fit items-center gap-3 text-3xl font-black text-ink">
        <span class="grid h-12 w-12 place-items-center rounded-full bg-brand-700 text-white"><QrCode :size="26" /></span>
        QR Feedback
      </RouterLink>

      <h1 class="text-center text-4xl font-black text-ink sm:text-5xl">Mot de passe oublié</h1>
      <p class="mt-4 text-center font-semibold text-slate-500">
        {{ codeStep ? 'Saisissez le code reçu par email et votre nouveau mot de passe.' : 'Entrez votre email, nous vous enverrons un code OTP.' }}
      </p>

      <form v-if="!codeStep" class="mt-10 space-y-5" @submit.prevent="submit">
        <label class="block">
          <span class="relative block">
            <Mail :size="22" class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input v-model="form.email" type="email" placeholder="Email address" class="h-16 w-full rounded-xl border border-slate-300 bg-white pl-14 pr-4 text-base font-semibold outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
          </span>
          <span v-if="errors.email" class="mt-2 block text-sm font-bold text-red-600">{{ errors.email }}</span>
        </label>

        <button class="h-16 w-full rounded-xl bg-brand-700 text-lg font-black text-white disabled:opacity-60" :disabled="loading">
          {{ loading ? 'Envoi...' : 'Recevoir un code' }}
        </button>
      </form>

      <form v-else class="mt-10 space-y-5" @submit.prevent="submitNewPassword">
        <label class="block">
          <span class="relative block">
            <ShieldCheck :size="22" class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input v-model="confirmForm.code" inputmode="numeric" maxlength="6" placeholder="Code OTP" class="h-16 w-full rounded-xl border border-slate-300 bg-white pl-14 pr-4 text-base font-semibold outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
          </span>
          <span v-if="confirmErrors.code" class="mt-2 block text-sm font-bold text-red-600">{{ confirmErrors.code }}</span>
          <button type="button" class="mt-3 text-sm font-black text-brand-700 disabled:opacity-50" :disabled="loading" @click="resendOtp">
            Renvoyer le code
          </button>
        </label>

        <label class="block">
          <PasswordField v-model="confirmForm.password" placeholder="Nouveau mot de passe" />
          <span v-if="confirmErrors.password" class="mt-2 block text-sm font-bold text-red-600">{{ confirmErrors.password }}</span>
        </label>

        <label class="block">
          <PasswordField v-model="confirmForm.confirmPassword" placeholder="Confirmation" />
          <span v-if="confirmErrors.confirmPassword" class="mt-2 block text-sm font-bold text-red-600">{{ confirmErrors.confirmPassword }}</span>
        </label>

        <button class="h-16 w-full rounded-xl bg-brand-700 text-lg font-black text-white disabled:opacity-60" :disabled="loading">
          {{ loading ? 'Mise à jour...' : 'Créer un nouveau mot de passe' }}
        </button>
      </form>

      <p v-if="toast" class="mt-6 rounded-xl px-4 py-3 text-sm font-bold" :class="toast.includes('envoyé') || toast.includes('modifié') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ toast }}</p>

      <div class="mt-8 space-y-2 text-center font-semibold text-slate-500">
        <p>
          Vous avez retrouvé votre mot de passe ?
          <RouterLink to="/login" class="font-black text-brand-700">Retour connexion</RouterLink>
        </p>
        <p>
          Pas encore de compte ?
          <RouterLink to="/signup" class="font-black text-brand-700">Créer un compte</RouterLink>
        </p>
      </div>
    </section>
  </main>
</template>
