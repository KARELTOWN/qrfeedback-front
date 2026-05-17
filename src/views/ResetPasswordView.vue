<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { resetPasswordSchema, validateForm, type FormErrors } from '../validators/auth.validator';
import PasswordField from '../components/PasswordField.vue';

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
  <main class="grid min-h-screen place-items-center bg-slate-100 px-4">
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
</template>
