<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { PlugZap, Save, Trash2 } from 'lucide-vue-next';
import { useWhatsApp, type WhatsappConfig, type WhatsappTemplate } from '../../composables/useWhatsApp';

const { getConfig, saveConfig, getTemplates, saveTemplate, deleteTemplate, estimateCost, sendTestMessage } = useWhatsApp();

const config = ref<WhatsappConfig | null>(null);
const templates = ref<WhatsappTemplate[]>([]);
const message = ref('');
const estimateMessage = ref('');
const testMessage = ref('');
const form = ref({
  wabaId: '',
  phoneNumberId: '',
  businessAccountId: '',
  displayPhoneNumber: '',
  accessToken: '',
  webhookVerifyToken: '',
  webhookSecret: '',
  status: 'active'
});
const templateForm = ref({
  name: '',
  languageCode: 'fr',
  category: 'utility',
  status: 'approved'
});
const testForm = ref({
  to: '',
  templateName: 'hello_world',
  languageCode: 'en_US'
});

async function load() {
  const [configResult, templatesResult] = await Promise.all([getConfig(), getTemplates()]);
  config.value = configResult.config;
  templates.value = templatesResult.templates;
  if (config.value) {
    form.value = {
      wabaId: config.value.wabaId,
      phoneNumberId: config.value.phoneNumberId,
      businessAccountId: config.value.businessAccountId || '',
      displayPhoneNumber: config.value.displayPhoneNumber || '',
      accessToken: '',
      webhookVerifyToken: '',
      webhookSecret: '',
      status: config.value.status || 'active'
    };
  }
}

async function submitConfig() {
  message.value = '';
  const result = await saveConfig(form.value);
  config.value = result.config;
  message.value = 'Configuration WhatsApp enregistrée.';
}

async function submitTemplate() {
  const result = await saveTemplate(templateForm.value);
  templates.value = [result.template, ...templates.value.filter((template) => template._id !== result.template._id)];
  templateForm.value.name = '';
}

async function removeTemplate(id: string) {
  await deleteTemplate(id);
  templates.value = templates.value.filter((template) => template._id !== id);
}

async function runEstimate() {
  const result = await estimateCost({ messageType: 'text', recipient: form.value.displayPhoneNumber });
  estimateMessage.value = `${result.estimate.estimatedCreditCost} crédit par message. Solde actuel: ${result.remainingCredits}.`;
}

async function sendTest() {
  testMessage.value = '';
  try {
    const result = await sendTestMessage(testForm.value);
    testMessage.value = `Message test envoyé. Statut: ${result.result.status}. ID: ${result.result.id}`;
  } catch (err) {
    testMessage.value = err instanceof Error ? err.message : 'Erreur inconnue';
  }
}

onMounted(load);
</script>

<template>
  <section class="grid gap-6">
    <div class="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <form class="rounded-2xl border border-slate-200 bg-white p-5" @submit.prevent="submitConfig">
        <div class="mb-5 flex items-center gap-3">
          <span class="grid h-11 w-11 place-items-center rounded-xl bg-brand-700 text-white"><PlugZap :size="22" /></span>
          <div>
            <h2 class="text-xl font-black text-ink">Connexion WhatsApp Cloud API</h2>
            <p class="text-sm font-semibold text-slate-500">Chaque entreprise utilise son propre numéro WhatsApp Business.</p>
          </div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block">
            <span class="mb-2 block text-sm font-black text-ink">WABA ID</span>
            <input v-model="form.wabaId" required class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-black text-ink">Phone Number ID</span>
            <input v-model="form.phoneNumberId" required class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-black text-ink">Business Account ID</span>
            <input v-model="form.businessAccountId" class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-black text-ink">Numéro affiché</span>
            <input v-model="form.displayPhoneNumber" placeholder="+229..." class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700" />
          </label>
          <label class="block sm:col-span-2">
            <span class="mb-2 block text-sm font-black text-ink">Access Token Meta</span>
            <input v-model="form.accessToken" required type="password" class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-black text-ink">Webhook Verify Token</span>
            <input v-model="form.webhookVerifyToken" class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700" />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm font-black text-ink">Webhook Secret</span>
            <input v-model="form.webhookSecret" type="password" class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700" />
          </label>
        </div>
        <div class="mt-5 flex flex-wrap gap-3">
          <button class="inline-flex h-12 items-center gap-2 rounded-xl bg-brand-700 px-5 font-black text-white"><Save :size="18" /> Enregistrer</button>
          <button type="button" class="h-12 rounded-xl border border-slate-300 px-5 font-black text-ink" @click="runEstimate">Tester estimation</button>
        </div>
        <p v-if="message" class="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{{ message }}</p>
        <p v-if="estimateMessage" class="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">{{ estimateMessage }}</p>
      </form>

      <div class="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 class="text-xl font-black text-ink">Paramètres Meta à copier</h2>
        <div class="mt-4 grid gap-3 text-sm font-semibold text-slate-700">
          <p><strong class="text-ink">Callback URL:</strong> /api/webhooks/whatsapp</p>
          <p><strong class="text-ink">Verify token:</strong> la valeur de WHATSAPP_WEBHOOK_VERIFY_TOKEN ou celle du client.</p>
          <p><strong class="text-ink">Permissions:</strong> whatsapp_business_messaging et whatsapp_business_management.</p>
          <p><strong class="text-ink">Crédits:</strong> 1 message accepté par Cloud API consomme 1 crédit plateforme.</p>
        </div>
      </div>
    </div>

    <form class="rounded-2xl border border-slate-200 bg-white p-5" @submit.prevent="sendTest">
      <div class="mb-4">
        <h2 class="text-xl font-black text-ink">Message test WhatsApp</h2>
        <p class="text-sm font-semibold text-slate-500">L’expéditeur est le Phone Number ID configuré ci-dessus. Le test utilise un template, par défaut hello_world.</p>
      </div>
      <div class="grid gap-3 md:grid-cols-[1fr_180px_140px_auto]">
        <label>
          <span class="mb-2 block text-sm font-black text-ink">Numéro destinataire</span>
          <input v-model="testForm.to" required placeholder="+229..." class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700" />
        </label>
        <label>
          <span class="mb-2 block text-sm font-black text-ink">Template</span>
          <input v-model="testForm.templateName" class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700" />
        </label>
        <label>
          <span class="mb-2 block text-sm font-black text-ink">Langue</span>
          <input v-model="testForm.languageCode" class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700" />
        </label>
        <button class="mt-7 h-12 rounded-xl bg-brand-700 px-5 font-black text-white">Envoyer test</button>
      </div>
      <p v-if="testMessage" class="mt-4 rounded-xl px-4 py-3 text-sm font-bold" :class="testMessage.includes('envoyé') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ testMessage }}</p>
    </form>

    <div class="rounded-2xl border border-slate-200 bg-white p-5">
      <div class="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 class="text-xl font-black text-ink">Templates WhatsApp</h2>
          <p class="text-sm font-semibold text-slate-500">Référence locale des templates approuvés côté Meta.</p>
        </div>
        <form class="grid gap-2 sm:grid-cols-[1fr_110px_140px_auto]" @submit.prevent="submitTemplate">
          <input v-model="templateForm.name" required placeholder="nom_template" class="h-11 rounded-xl border border-slate-300 px-3 font-semibold" />
          <input v-model="templateForm.languageCode" class="h-11 rounded-xl border border-slate-300 px-3 font-semibold" />
          <select v-model="templateForm.category" class="h-11 rounded-xl border border-slate-300 px-3 font-semibold">
            <option value="utility">Utility</option>
            <option value="marketing">Marketing</option>
            <option value="authentication">Authentication</option>
            <option value="service">Service</option>
          </select>
          <button class="h-11 rounded-xl bg-brand-700 px-4 font-black text-white">Ajouter</button>
        </form>
      </div>
      <div class="overflow-x-auto rounded-2xl border border-slate-200">
        <table class="min-w-[720px] w-full text-left">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-sm font-black text-ink">Nom</th>
              <th class="px-4 py-3 text-sm font-black text-ink">Langue</th>
              <th class="px-4 py-3 text-sm font-black text-ink">Catégorie</th>
              <th class="px-4 py-3 text-sm font-black text-ink">Statut</th>
              <th class="px-4 py-3 text-sm font-black text-ink">Crédit</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="template in templates" :key="template._id" class="border-t border-slate-200">
              <td class="px-4 py-3 font-black text-ink">{{ template.name }}</td>
              <td class="px-4 py-3 font-semibold text-slate-600">{{ template.languageCode }}</td>
              <td class="px-4 py-3 font-semibold text-slate-600">{{ template.category }}</td>
              <td class="px-4 py-3 font-semibold text-slate-600">{{ template.status }}</td>
              <td class="px-4 py-3 font-black text-brand-700">{{ template.estimatedCreditCost }}</td>
              <td class="px-4 py-3 text-right"><button class="grid h-9 w-9 place-items-center rounded-xl border border-slate-300" @click="removeTemplate(template._id)"><Trash2 :size="16" /></button></td>
            </tr>
            <tr v-if="!templates.length"><td colspan="6" class="px-4 py-8 text-center font-bold text-slate-500">Aucun template enregistré.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
