<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Eye, FilePlus2, Mail, MessageSquareText, Save, Variable } from 'lucide-vue-next';
import TemplateRichTextEditor from '../../components/admin/TemplateRichTextEditor.vue';
import { useAdmin, type NotificationTemplate } from '../../composables/useAdmin';

const admin = useAdmin();
const templates = ref<NotificationTemplate[]>([]);
const selected = ref<NotificationTemplate | null>(null);
const emailEditor = ref<InstanceType<typeof TemplateRichTextEditor> | null>(null);
const smsEditor = ref<InstanceType<typeof TemplateRichTextEditor> | null>(null);
const activeEditor = ref<'email' | 'sms'>('email');
const loading = ref(false);
const saving = ref(false);
const error = ref('');
const success = ref('');
const preview = ref<{ email: { subject: string; html: string }; sms: { title: string; body: string } } | null>(null);

const form = ref<NotificationTemplate>({ name: '', label: '', emailTemplate: '', smsTemplate: '', emailTitle: '', smsTitle: '', emailVariables: [], smsVariables: [], isActive: true });
const variables = computed(() => activeEditor.value === 'email' ? form.value.emailVariables : form.value.smsVariables);
const isNew = computed(() => !selected.value);

function clone(template: NotificationTemplate) { return JSON.parse(JSON.stringify(template)) as NotificationTemplate; }
function selectTemplate(template: NotificationTemplate) { selected.value = template; form.value = clone(template); preview.value = null; success.value = ''; }
function newTemplate() { selected.value = null; form.value = { name: '', label: '', emailTemplate: '<p>Bonjour #recipientName,</p>', smsTemplate: '', emailTitle: '', smsTitle: '', emailVariables: [], smsVariables: [], isActive: true }; preview.value = null; }
function addVariable(channel: 'email' | 'sms') { const target = channel === 'email' ? form.value.emailVariables : form.value.smsVariables; target.push({ key: '', label: '', description: '' }); }
function removeVariable(channel: 'email' | 'sms', index: number) { (channel === 'email' ? form.value.emailVariables : form.value.smsVariables).splice(index, 1); }
function insertVariable(key: string) { if (!key) return; (activeEditor.value === 'email' ? emailEditor.value : smsEditor.value)?.insertText(`#${key}`); }

async function load() {
  loading.value = true; error.value = '';
  try { templates.value = (await admin.getNotificationTemplates()).templates; if (!selected.value && templates.value[0]) selectTemplate(templates.value[0]); }
  catch (err) { error.value = err instanceof Error ? err.message : 'Impossible de charger les modèles.'; }
  finally { loading.value = false; }
}

async function save() {
  saving.value = true; error.value = ''; success.value = '';
  try {
    const payload = clone(form.value);
    const response = isNew.value ? await admin.createNotificationTemplate(payload) : await admin.updateNotificationTemplate(payload.name, payload);
    const index = templates.value.findIndex((item) => item.name === response.template.name);
    if (index >= 0) templates.value[index] = response.template; else templates.value.push(response.template);
    selectTemplate(response.template); success.value = 'Modèle enregistré.';
  } catch (err) { error.value = err instanceof Error ? err.message : 'Enregistrement impossible.'; }
  finally { saving.value = false; }
}

async function showPreview() {
  error.value = '';
  try {
    const values = Object.fromEntries([...form.value.emailVariables, ...form.value.smsVariables].filter((item) => item.key).map((item) => [item.key, `Exemple ${item.label || item.key}`]));
    preview.value = await admin.previewNotificationTemplate(form.value.name, values);
  } catch (err) { error.value = err instanceof Error ? err.message : 'Prévisualisation impossible. Enregistrez d’abord le modèle.'; }
}

onMounted(load);
</script>

<template>
  <section class="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)]">
    <aside class="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div class="mb-4 flex items-center justify-between"><h2 class="font-black text-ink">Modèles</h2><button class="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-white" title="Nouveau modèle" @click="newTemplate"><FilePlus2 :size="18" /></button></div>
      <p v-if="loading" class="p-3 text-sm font-semibold text-slate-500">Chargement…</p>
      <button v-for="template in templates" :key="template.name" class="mb-2 w-full rounded-2xl border p-3 text-left transition" :class="selected?.name === template.name ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'" @click="selectTemplate(template)">
        <span class="block font-black text-ink">{{ template.label }}</span><span class="mt-1 block font-mono text-xs text-slate-500">{{ template.name }}</span>
        <span class="mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-bold" :class="template.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'">{{ template.isActive ? 'Actif' : 'Inactif' }}</span>
      </button>
    </aside>

    <div class="min-w-0 space-y-5">
      <div v-if="error" class="rounded-2xl bg-red-50 px-4 py-3 font-bold text-red-700">{{ error }}</div><div v-if="success" class="rounded-2xl bg-emerald-50 px-4 py-3 font-bold text-emerald-700">{{ success }}</div>
      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-7">
        <div class="flex flex-wrap items-start justify-between gap-4"><div><p class="text-sm font-black uppercase tracking-wide text-brand-700">Notification</p><h2 class="mt-1 text-2xl font-black text-ink">{{ isNew ? 'Nouveau modèle' : form.label }}</h2></div><label class="flex items-center gap-2 font-bold text-slate-700"><input v-model="form.isActive" type="checkbox" class="h-4 w-4 accent-brand-700" /> Actif</label></div>
        <div class="mt-6 grid gap-4 md:grid-cols-2"><label class="grid gap-2 text-sm font-black text-slate-700">Nom technique<input v-model="form.name" :readonly="!isNew" class="rounded-xl border border-slate-300 px-3 py-2.5 font-mono text-sm outline-none focus:border-brand-600" placeholder="ex. appointment-reminder" /></label><label class="grid gap-2 text-sm font-black text-slate-700">Nom affiché<input v-model="form.label" class="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-600" /></label></div>
      </div>

      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-7"><div class="flex items-center gap-2"><Mail class="text-brand-700" :size="20" /><h3 class="text-xl font-black text-ink">E-mail</h3></div><label class="mt-5 grid gap-2 text-sm font-black text-slate-700">Titre<input v-model="form.emailTitle" class="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-600" placeholder="Nouvel avis pour #companyName" @focus="activeEditor = 'email'" /></label><div class="mt-5" @click="activeEditor = 'email'"><p class="mb-2 text-sm font-black text-slate-700">Corps <span class="font-normal text-slate-500">— édité avec SunEditor</span></p><TemplateRichTextEditor ref="emailEditor" v-model="form.emailTemplate" /></div></div>
      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-7"><div class="flex items-center gap-2"><MessageSquareText class="text-brand-700" :size="20" /><h3 class="text-xl font-black text-ink">SMS <span class="text-sm font-bold text-slate-400">(transport non activé)</span></h3></div><label class="mt-5 grid gap-2 text-sm font-black text-slate-700">Titre SMS<input v-model="form.smsTitle" class="rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-600" @focus="activeEditor = 'sms'" /></label><div class="mt-5" @click="activeEditor = 'sms'"><p class="mb-2 text-sm font-black text-slate-700">Message</p><TemplateRichTextEditor ref="smsEditor" v-model="form.smsTemplate" placeholder="Votre message SMS…" /></div></div>
      <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:p-7"><div class="flex items-center gap-2"><Variable class="text-brand-700" :size="20" /><h3 class="text-xl font-black text-ink">Variables</h3></div><p class="mt-2 text-sm font-semibold text-slate-500">Cliquez une variable pour insérer <code>#variable</code> dans l’éditeur actif.</p><div class="mt-4 grid gap-4 lg:grid-cols-2" v-for="channel in ['email', 'sms'] as const" :key="channel"><div class="rounded-2xl bg-slate-50 p-4"><div class="mb-3 flex items-center justify-between"><strong class="capitalize text-ink">{{ channel }}</strong><button class="rounded-lg bg-white px-3 py-1.5 text-sm font-black text-brand-700 shadow-sm" @click="addVariable(channel)">Ajouter</button></div><div v-for="(item, index) in (channel === 'email' ? form.emailVariables : form.smsVariables)" :key="index" class="mb-2 grid grid-cols-[1fr_1fr_auto] gap-2"><input v-model="item.key" class="min-w-0 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="companyName" /><input v-model="item.label" class="min-w-0 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="Entreprise" /><button class="rounded-lg px-2 text-red-600" @click="removeVariable(channel, index)">×</button></div></div></div><div class="mt-4 flex flex-wrap gap-2"><button v-for="item in variables" :key="`${activeEditor}-${item.key}`" class="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-black text-brand-700" @click="insertVariable(item.key)">#{{ item.key || 'variable' }}</button></div></div>
      <div class="flex flex-wrap justify-end gap-3"><button class="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-black text-ink" @click="showPreview"><Eye :size="18" /> Prévisualiser</button><button class="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-700 px-4 font-black text-white disabled:opacity-50" :disabled="saving" @click="save"><Save :size="18" /> {{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button></div>
      <div v-if="preview" class="grid gap-5 rounded-3xl border border-brand-100 bg-brand-50 p-5 xl:grid-cols-[1fr_320px]"><div><p class="font-black text-ink">Aperçu e-mail — {{ preview.email.subject }}</p><iframe class="mt-3 min-h-[420px] w-full rounded-xl border border-slate-200 bg-white" :srcdoc="preview.email.html" title="Prévisualisation e-mail" /></div><div><p class="font-black text-ink">Aperçu SMS — {{ preview.sms.title }}</p><div class="mt-3 rounded-3xl bg-slate-900 p-5 text-white"><p class="text-xs font-bold text-slate-400">Opinbase</p><p class="mt-3 whitespace-pre-wrap leading-6">{{ preview.sms.body }}</p></div></div></div>
    </div>
  </section>
</template>
