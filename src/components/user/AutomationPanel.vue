<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { Eye, Pause, Play, Plus, Save, Send, Trash2 } from 'lucide-vue-next';
import {
  useAutomations,
  type Automation,
  type AutomationDetail,
  type AutomationStep,
  type AutomationTestResult
} from '../../composables/useAutomations';

const {
  listAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  publishAutomation,
  pauseAutomation,
  deleteAutomation,
  testAutomation
} = useAutomations();

const automations = ref<Automation[]>([]);
const selected = ref<AutomationDetail | null>(null);
const selectedStep = ref<AutomationStep | null>(null);
const message = ref('');
const stepConfigText = ref('');
const testTo = ref('');
const testResult = ref<AutomationTestResult | null>(null);
const form = ref({
  name: '',
  description: '',
  triggerType: 'feedback_submitted',
  actionType: 'create_internal_alert',
  actionConfig: ''
});

const defaultConfigs: Record<string, string> = {
  create_internal_alert: '{\n  "title": "Nouvel événement",\n  "message": "Une automation a été déclenchée."\n}',
  notify_manager: '{\n  "subject": "Notification automation",\n  "message": "Une automation demande votre attention."\n}',
  add_tag: '{\n  "tag": "nouveau"\n}',
  remove_tag: '{\n  "tag": "nouveau"\n}',
  create_inbox_conversation: '{\n  "message": "Conversation créée depuis automation",\n  "channel": "whatsapp"\n}',
  create_ticket: '{\n  "subject": "Ticket automation",\n  "description": "Ticket créé depuis automation",\n  "priority": "normal"\n}',
  send_whatsapp_message: '{\n  "mode": "template",\n  "to": "{{contact.whatsapp}}",\n  "templateName": "hello_world",\n  "languageCode": "en_US",\n  "components": []\n}'
};

form.value.actionConfig = defaultConfigs.create_internal_alert;

async function load() {
  automations.value = (await listAutomations()).automations;
  if (!selected.value && automations.value[0]) await selectAutomation(automations.value[0]._id);
}

async function selectAutomation(id: string) {
  selected.value = await getAutomation(id);
  selectStep(selected.value.steps[0] || null);
}

function configObject(text = form.value.actionConfig) {
  return JSON.parse(text || '{}') as Record<string, unknown>;
}

function selectStep(step: AutomationStep | null) {
  selectedStep.value = step;
  stepConfigText.value = JSON.stringify(step?.config || {}, null, 2);
  testResult.value = null;
}

function applyStepConfig() {
  if (!selectedStep.value) return;
  selectedStep.value.config = configObject(stepConfigText.value);
  message.value = 'Configuration étape prête. Cliquez sur Sauver pour persister.';
}

async function submitAutomation() {
  message.value = '';
  const payload = {
    name: form.value.name,
    description: form.value.description,
    triggers: [{ type: form.value.triggerType, enabled: true, config: {} }],
    steps: [{
      key: 'step_1',
      name: form.value.actionType,
      type: 'action' as const,
      actionType: form.value.actionType,
      position: 1,
      config: configObject(),
      enabled: true
    }]
  };
  selected.value = await createAutomation(payload);
  selectStep(selected.value.steps[0] || null);
  message.value = 'Automation créée.';
  form.value.name = '';
  await load();
}

async function saveSelected() {
  if (!selected.value) return;
  if (selectedStep.value) applyStepConfig();
  selected.value = await updateAutomation(selected.value.automation._id, {
    name: selected.value.automation.name,
    description: selected.value.automation.description,
    triggers: selected.value.triggers,
    steps: selected.value.steps
  });
  selectStep(selected.value.steps.find((step) => step.key === selectedStep.value?.key) || selected.value.steps[0] || null);
  message.value = 'Automation enregistrée.';
  await load();
}

async function publishSelected() {
  if (!selected.value) return;
  selected.value = await publishAutomation(selected.value.automation._id);
  await load();
}

async function pauseSelected() {
  if (!selected.value) return;
  selected.value = await pauseAutomation(selected.value.automation._id);
  await load();
}

async function removeSelected() {
  if (!selected.value) return;
  await deleteAutomation(selected.value.automation._id);
  selected.value = null;
  selectedStep.value = null;
  await load();
}

async function runAutomationTest() {
  if (!selected.value) return;
  await saveSelected();
  testResult.value = await testAutomation(selected.value.automation._id, {
    to: testTo.value,
    whatsapp: testTo.value,
    contact: {
      firstName: 'Client',
      lastName: 'Test',
      whatsapp: testTo.value
    }
  });
}

watch(() => form.value.actionType, (actionType) => {
  form.value.actionConfig = defaultConfigs[actionType] || '{}';
});

onMounted(load);
</script>

<template>
  <section class="grid gap-5 xl:grid-cols-[380px_1fr]">
    <aside class="grid gap-5">
      <form class="rounded-2xl border border-slate-200 bg-white p-5" @submit.prevent="submitAutomation">
        <div class="mb-4 flex items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-xl bg-brand-700 text-white"><Plus :size="20" /></span>
          <h2 class="text-xl font-black text-ink">Nouvelle automation</h2>
        </div>
        <div class="grid gap-3">
          <input v-model="form.name" required placeholder="Nom" class="h-11 rounded-xl border border-slate-300 px-3 font-semibold" />
          <textarea v-model="form.description" rows="2" placeholder="Description" class="rounded-xl border border-slate-300 px-3 py-2 font-semibold"></textarea>
          <select v-model="form.triggerType" class="h-11 rounded-xl border border-slate-300 px-3 font-semibold">
            <option value="feedback_submitted">Avis reçu</option>
            <option value="contact_created">Contact créé</option>
            <option value="contact_updated">Contact modifié</option>
          </select>
          <select v-model="form.actionType" class="h-11 rounded-xl border border-slate-300 px-3 font-semibold">
            <option value="create_internal_alert">Créer alerte</option>
            <option value="notify_manager">Notifier manager</option>
            <option value="send_whatsapp_message">Envoyer WhatsApp</option>
            <option value="add_tag">Ajouter tag</option>
            <option value="remove_tag">Retirer tag</option>
            <option value="create_inbox_conversation">Créer conversation</option>
            <option value="create_ticket">Créer ticket</option>
          </select>
          <textarea v-model="form.actionConfig" rows="8" class="rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm"></textarea>
          <button class="h-11 rounded-xl bg-brand-700 font-black text-white">Créer</button>
        </div>
      </form>

      <div class="rounded-2xl border border-slate-200 bg-white">
        <button v-for="automation in automations" :key="automation._id" class="grid w-full gap-1 border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50" @click="selectAutomation(automation._id)">
          <span class="flex justify-between gap-3">
            <strong class="truncate text-ink">{{ automation.name }}</strong>
            <span class="rounded-full px-2 py-0.5 text-xs font-black" :class="automation.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'">{{ automation.status }}</span>
          </span>
          <span class="text-xs font-bold text-slate-500">v{{ automation.version }} · {{ new Date(automation.updatedAt).toLocaleDateString('fr-FR') }}</span>
        </button>
        <p v-if="!automations.length" class="p-5 text-sm font-bold text-slate-500">Aucune automation.</p>
      </div>
    </aside>

    <div class="rounded-2xl border border-slate-200 bg-white p-5">
      <div v-if="selected" class="grid gap-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <input v-model="selected.automation.name" class="h-12 min-w-[280px] rounded-xl border border-slate-300 px-4 text-xl font-black text-ink" />
            <p class="mt-2 text-sm font-bold text-slate-500">{{ selected.automation.status }}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 font-black" @click="saveSelected"><Save :size="17" /> Sauver</button>
            <button class="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 font-black text-white" @click="publishSelected"><Play :size="17" /> Publier</button>
            <button class="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 font-black" @click="pauseSelected"><Pause :size="17" /> Pause</button>
            <button class="grid h-11 w-11 place-items-center rounded-xl border border-red-200 text-red-700" @click="removeSelected"><Trash2 :size="17" /></button>
          </div>
        </div>

        <textarea v-model="selected.automation.description" rows="2" class="rounded-xl border border-slate-300 px-4 py-3 font-semibold"></textarea>

        <div class="grid gap-4 lg:grid-cols-2">
          <div class="rounded-2xl bg-slate-50 p-4">
            <h3 class="font-black text-ink">Déclencheurs</h3>
            <div v-for="trigger in selected.triggers" :key="trigger._id || trigger.type" class="mt-3 rounded-xl bg-white p-3">
              <strong>{{ trigger.type }}</strong>
            </div>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <h3 class="font-black text-ink">Étapes</h3>
            <button v-for="step in selected.steps" :key="step._id || step.key" class="mt-3 grid w-full rounded-xl bg-white p-3 text-left transition hover:bg-brand-50" :class="selectedStep?.key === step.key ? 'ring-2 ring-brand-700' : ''" @click="selectStep(step)">
              <strong>{{ step.name || step.key }}</strong>
              <p class="text-sm font-semibold text-slate-500">{{ step.actionType || step.type }}</p>
            </button>
          </div>
        </div>

        <div v-if="selectedStep" class="grid gap-4 rounded-2xl border border-slate-200 p-4 xl:grid-cols-[1fr_0.9fr]">
          <div>
            <div class="mb-3 flex items-center justify-between gap-3">
              <h3 class="font-black text-ink">Configuration de l'étape</h3>
              <button class="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-black" @click="applyStepConfig"><Save :size="15" /> Appliquer</button>
            </div>
            <textarea v-model="stepConfigText" rows="12" class="w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm outline-none focus:border-brand-700"></textarea>
          </div>
          <div class="grid gap-4">
            <div class="rounded-2xl bg-slate-50 p-4">
              <h3 class="flex items-center gap-2 font-black text-ink"><Eye :size="17" /> Prévisualisation</h3>
              <div class="mt-3 grid gap-2 text-sm font-semibold text-slate-700">
                <p><strong class="text-ink">Action:</strong> {{ selectedStep.actionType }}</p>
                <p><strong class="text-ink">Template:</strong> {{ (selectedStep.config || {}).templateName || '-' }}</p>
                <p><strong class="text-ink">Langue:</strong> {{ (selectedStep.config || {}).languageCode || '-' }}</p>
                <p><strong class="text-ink">Destinataire:</strong> {{ (selectedStep.config || {}).to || '-' }}</p>
              </div>
            </div>
            <form class="rounded-2xl bg-slate-50 p-4" @submit.prevent="runAutomationTest">
              <h3 class="font-black text-ink">Tester l'automation</h3>
              <input v-model="testTo" placeholder="+229..." class="mt-3 h-11 w-full rounded-xl border border-slate-300 px-3 font-semibold" />
              <button class="mt-3 inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 font-black text-white"><Send :size="16" /> Tester</button>
            </form>
            <div v-if="testResult" class="rounded-2xl border border-slate-200 p-4">
              <h3 class="font-black text-ink">Résultat</h3>
              <p class="mt-2 text-sm font-bold" :class="testResult.execution.status === 'failed' ? 'text-red-700' : 'text-emerald-700'">{{ testResult.execution.status }}</p>
              <div class="mt-3 max-h-44 overflow-y-auto rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-700">
                <p v-for="log in testResult.logs" :key="log._id">{{ log.event }} · {{ log.message || log.error?.message || JSON.stringify(log.data || {}) }}</p>
              </div>
            </div>
          </div>
        </div>

        <p v-if="message" class="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{{ message }}</p>
      </div>
      <p v-else class="grid min-h-[360px] place-items-center text-center font-bold text-slate-500">Sélectionnez ou créez une automation.</p>
    </div>
  </section>
</template>
