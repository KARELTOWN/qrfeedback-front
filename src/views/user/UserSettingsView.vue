<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { Lock, Mail, MessageSquareText, Send } from 'lucide-vue-next';
import FeedbackFormSettings from '../../components/user/FeedbackFormSettings.vue';
import PasswordField from '../../components/PasswordField.vue';
import { useAuth } from '../../composables/useAuth';
import { useDashboard, type FeedbackFormConfig, type NotificationPreferences, type TelegramProfile } from '../../composables/useDashboard';
import { useToast } from '../../composables/useToast';
import { changePasswordSchema, validateForm, type FormErrors } from '../../validators/auth.validator';

type SettingsTab = 'feedback-form' | 'notifications' | 'password';
type ChangePasswordForm = { currentPassword: string; newPassword: string; confirmPassword: string };

const { changePassword } = useAuth();
const { getFeedbackFormConfig, updateFeedbackFormConfig, getNotificationPreferences, updateNotificationPreferences, getTelegramLink, getTelegramProfile } = useDashboard();
const { showToast } = useToast();
const settingsTab = ref<SettingsTab>('feedback-form');
const formConfig = ref<FeedbackFormConfig | null>(null);
const formConfigMessage = ref('');
const notificationPreferences = ref<NotificationPreferences>({ whatsappEnabled: true, emailEnabled: true, telegramEnabled: true });
const telegramProfile = ref<TelegramProfile | null>(null);
const notificationMessage = ref('');
const passwordForm = ref<ChangePasswordForm>({ currentPassword: '', newPassword: '', confirmPassword: '' });
const passwordErrors = ref<FormErrors<ChangePasswordForm>>({});

async function saveFormConfig() {
  if (!formConfig.value) return;
  formConfigMessage.value = '';
  try {
    formConfig.value = await updateFeedbackFormConfig(formConfig.value);
    formConfigMessage.value = 'Configuration enregistrée.';
  } catch (err) { formConfigMessage.value = err instanceof Error ? err.message : 'Erreur inconnue'; }
}
async function saveNotificationPreferences() {
  notificationMessage.value = '';
  try {
    notificationPreferences.value = await updateNotificationPreferences(notificationPreferences.value);
    notificationMessage.value = 'Préférences enregistrées.';
  } catch (err) { notificationMessage.value = err instanceof Error ? err.message : 'Erreur inconnue'; }
}
async function connectTelegram() {
  notificationMessage.value = '';
  try {
    const link = await getTelegramLink();
    window.open(link.url, '_blank', 'noopener,noreferrer');
    notificationMessage.value = 'Connexion Telegram ouverte. Validez dans Telegram puis revenez ici.';
  } catch (err) { notificationMessage.value = err instanceof Error ? err.message : 'Erreur inconnue'; }
}
async function refreshTelegramProfile() {
  const result = await getTelegramProfile();
  telegramProfile.value = result.telegramProfile?.isActive ? result.telegramProfile : null;
}
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
async function load() {
  const [config, preferences] = await Promise.all([getFeedbackFormConfig(), getNotificationPreferences()]);
  formConfig.value = config;
  notificationPreferences.value = { whatsappEnabled: true, emailEnabled: true, telegramEnabled: true, ...preferences };
  await refreshTelegramProfile();
}
onMounted(load);
</script>

<template>
  <section class="grid gap-6">
    <div class="inline-flex w-fit rounded-2xl border border-slate-300 bg-white p-1">
      <button class="h-11 rounded-xl px-4 text-sm font-black transition" :class="settingsTab === 'feedback-form' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'" @click="settingsTab = 'feedback-form'">Formulaire de feedback</button>
      <button class="h-11 rounded-xl px-4 text-sm font-black transition" :class="settingsTab === 'password' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'" @click="settingsTab = 'password'">Mot de passe</button>
      <button class="h-11 rounded-xl px-4 text-sm font-black transition" :class="settingsTab === 'notifications' ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-50'" @click="settingsTab = 'notifications'">Notifications</button>
    </div>

    <FeedbackFormSettings v-if="settingsTab === 'feedback-form'" :model-value="formConfig" :message="formConfigMessage" @save="saveFormConfig" />

    <div v-if="settingsTab === 'notifications'" class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div class="mb-6"><h2 class="text-2xl font-black text-ink">Notifications globales</h2><p class="mt-1 font-semibold text-slate-500">Ces réglages s'appliquent à tous les QR codes, sauf désactivation spécifique sur un QR code.</p></div>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="flex items-center justify-between gap-4 rounded-2xl bg-white p-5"><span class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Send :size="20" /></span><span><strong class="block text-ink">Telegram</strong><span class="text-sm font-semibold text-slate-500">Avis instantanés</span></span></span><input v-model="notificationPreferences.telegramEnabled" type="checkbox" class="h-6 w-6 accent-brand-700" /></label>
        <label class="flex items-center justify-between gap-4 rounded-2xl bg-white p-5"><span class="flex items-center gap-3"><span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700"><Mail :size="20" /></span><span><strong class="block text-ink">Email</strong><span class="text-sm font-semibold text-slate-500">Avis soumis</span></span></span><input v-model="notificationPreferences.emailEnabled" type="checkbox" class="h-6 w-6 accent-brand-700" /></label>
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-5">
          <span class="min-w-0 font-black text-ink">
            {{ telegramProfile ? `Telegram connecté${telegramProfile.username ? ' à @' + telegramProfile.username : ''}` : 'Telegram non connecté' }}
          </span>
          <div class="flex flex-wrap gap-2">
            <button class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-50 px-4 py-3 font-black text-brand-700 transition hover:bg-brand-100" type="button" @click="connectTelegram"><Send :size="18" /> {{ telegramProfile ? 'Reconnecter' : 'Connecter Telegram' }}</button>
            <button class="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 font-black text-slate-600 transition hover:bg-slate-50" type="button" @click="refreshTelegramProfile">Actualiser</button>
          </div>
        </div>
      </div>
      <p v-if="notificationMessage" class="mt-4 rounded-xl px-4 py-3 text-sm font-bold" :class="notificationMessage.includes('enregistr') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ notificationMessage }}</p>
      <button class="mt-6 h-13 w-full rounded-xl bg-brand-700 px-5 text-base font-black text-white" @click="saveNotificationPreferences">Enregistrer</button>
    </div>

    <div v-if="settingsTab === 'password'" class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
      <div class="mb-6 flex items-center gap-3"><span class="grid h-12 w-12 place-items-center rounded-full bg-brand-700 text-white"><Lock :size="22" /></span><div><h2 class="text-2xl font-black text-ink">Changer le mot de passe</h2><p class="mt-1 font-semibold text-slate-500">Renseignez l'ancien mot de passe puis confirmez le nouveau.</p></div></div>
      <form class="grid max-w-2xl gap-5" @submit.prevent="submitPasswordChange"><label class="block"><span class="mb-2 block font-black text-ink">Ancien mot de passe</span><PasswordField v-model="passwordForm.currentPassword" input-class="h-13" /><span v-if="passwordErrors.currentPassword" class="mt-2 block text-sm font-bold text-red-600">{{ passwordErrors.currentPassword }}</span></label><label class="block"><span class="mb-2 block font-black text-ink">Nouveau mot de passe</span><PasswordField v-model="passwordForm.newPassword" placeholder="Nouveau mot de passe" input-class="h-13" /><span v-if="passwordErrors.newPassword" class="mt-2 block text-sm font-bold text-red-600">{{ passwordErrors.newPassword }}</span></label><label class="block"><span class="mb-2 block font-black text-ink">Confirmation</span><PasswordField v-model="passwordForm.confirmPassword" placeholder="Confirmation" input-class="h-13" /><span v-if="passwordErrors.confirmPassword" class="mt-2 block text-sm font-bold text-red-600">{{ passwordErrors.confirmPassword }}</span></label><button class="h-13 rounded-xl bg-brand-700 px-5 font-black text-white">Mettre à jour</button></form>
    </div>
  </section>
</template>
