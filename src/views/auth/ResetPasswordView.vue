<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MessageCircle, QrCode } from 'lucide-vue-next';
import { useAuth } from '../../composables/useAuth';
import { resetPasswordSchema, validateForm, type FormErrors } from '../../validators/auth.validator';
import PasswordField from '../../components/PasswordField.vue';

type ResetForm = { password: string };

const route = useRoute();
const router = useRouter();
const { resetPassword } = useAuth();
const password = ref('');
const errors = ref<FormErrors<ResetForm>>({});
const error = ref('');

async function reset() {
  error.value = '';
  errors.value = await validateForm(resetPasswordSchema, { password: password.value });
  if (Object.keys(errors.value).length) return;

  try {
    await resetPassword(String(route.query.token || ''), password.value);
    router.push('/login');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erreur inconnue';
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
    <form class="w-full max-w-xl rounded-3xl bg-white p-8 shadow-xl shadow-slate-200" @submit.prevent="reset">
      <h1 class="text-4xl font-black text-ink">Nouveau mot de passe</h1>
      <label class="mt-8 block">
        <span class="mb-2 block font-extrabold text-ink">Mot de passe</span>
        <PasswordField v-model="password" minlength="8" required input-class="h-14" />
        <span v-if="errors.password" class="mt-2 block text-sm font-bold text-red-600">{{ errors.password }}</span>
      </label>
      <button class="mt-6 h-14 w-full rounded-xl bg-brand-700 font-black text-white">Mettre à jour</button>
      <p v-if="error" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{{ error }}</p>
    </form>
    </main>
  </div>
</template>
