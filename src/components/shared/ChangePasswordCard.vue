<script setup lang="ts">
import { ref } from 'vue';
import { Lock } from 'lucide-vue-next';
import PasswordField from '../PasswordField.vue';
import { useAuth } from '../../composables/useAuth';
import { useToast } from '../../composables/useToast';
import { changePasswordSchema, validateForm, type FormErrors } from '../../validators/auth.validator';

type ChangePasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string };

const { changePassword } = useAuth();
const { showToast } = useToast();
const passwordForm = ref<ChangePasswordForm>({ currentPassword: '', newPassword: '', confirmPassword: '' });
const passwordErrors = ref<FormErrors<ChangePasswordForm>>({});

async function submitPasswordChange() {
  passwordErrors.value = await validateForm(changePasswordSchema, passwordForm.value);
  if (Object.keys(passwordErrors.value).length) return;
  try {
    await changePassword({ currentPassword: passwordForm.value.currentPassword, newPassword: passwordForm.value.newPassword });
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
    showToast('Mot de passe modifié avec succès.', 'success');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    if (message.toLowerCase().includes('actuel') || message.toLowerCase().includes('incorrect')) { passwordErrors.value.currentPassword = message; return; }
    if (message.toLowerCase().includes('nouveau')) { passwordErrors.value.newPassword = message; return; }
    showToast(message, 'error');
  }
}
</script>

<template>
  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
    <div class="mb-6 flex items-center gap-3">
      <span class="grid h-12 w-12 place-items-center rounded-full bg-brand-700 text-white"><Lock :size="22" /></span>
      <div>
        <h2 class="text-2xl font-black text-ink">Changer le mot de passe</h2>
        <p class="mt-1 font-semibold text-slate-500">Renseignez l'ancien mot de passe puis confirmez le nouveau.</p>
      </div>
    </div>
    <form class="grid max-w-2xl gap-5" @submit.prevent="submitPasswordChange">
      <label class="block">
        <span class="mb-2 block font-black text-ink">Ancien mot de passe</span>
        <PasswordField v-model="passwordForm.currentPassword" input-class="h-13" />
        <span v-if="passwordErrors.currentPassword" class="mt-2 block text-sm font-bold text-red-600">{{ passwordErrors.currentPassword }}</span>
      </label>
      <label class="block">
        <span class="mb-2 block font-black text-ink">Nouveau mot de passe</span>
        <PasswordField v-model="passwordForm.newPassword" placeholder="Nouveau mot de passe" input-class="h-13" />
        <span v-if="passwordErrors.newPassword" class="mt-2 block text-sm font-bold text-red-600">{{ passwordErrors.newPassword }}</span>
      </label>
      <label class="block">
        <span class="mb-2 block font-black text-ink">Confirmation</span>
        <PasswordField v-model="passwordForm.confirmPassword" placeholder="Confirmation" input-class="h-13" />
        <span v-if="passwordErrors.confirmPassword" class="mt-2 block text-sm font-bold text-red-600">{{ passwordErrors.confirmPassword }}</span>
      </label>
      <button class="h-13 rounded-xl bg-brand-700 px-5 font-black text-white">Mettre à jour</button>
    </form>
  </div>
</template>
