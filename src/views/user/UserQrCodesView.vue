<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ChevronDown, Code2, Copy, Download, Eye, Mail, MessageSquareText, Plus, Send } from 'lucide-vue-next';
import BasePagination from '../../components/shared/BasePagination.vue';
import { useDashboard, type CompanyQrCode, type NotificationPreferences, type PaginationMeta } from '../../composables/useDashboard';
import { useToast } from '../../composables/useToast';

const { getQrCodes, createQrCode, updateQrCodeNotifications } = useDashboard();
const { showToast } = useToast();
const emptyPagination: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
const qrCodes = ref<CompanyQrCode[]>([]);
const qrCodePagination = ref<PaginationMeta>(emptyPagination);
const qrCodePage = ref(1);
const pageSize = 10;
const qrForm = ref({ label: '' });
const qrMessage = ref('');
const qrCodeTotalPages = computed(() => qrCodePagination.value.totalPages);

function qrNotifications(qr: CompanyQrCode) { return qr.notificationPreferences || { whatsappEnabled: true, emailEnabled: true, telegramEnabled: true }; }
async function loadQrCodes() { const result = await getQrCodes(qrCodePage.value, pageSize); qrCodes.value = result.qrCodes; qrCodePagination.value = result.pagination; }
async function goQrCodePage(page: number) { qrCodePage.value = Math.min(Math.max(page, 1), qrCodeTotalPages.value); await loadQrCodes(); }
async function submitQrCode() {
  qrMessage.value = '';
  try {
    await createQrCode({ label: qrForm.value.label || undefined });
    qrCodePage.value = 1;
    await loadQrCodes();
    qrForm.value = { label: '' };
    qrMessage.value = 'QR Code créé.';
  } catch (err) { qrMessage.value = err instanceof Error ? err.message : 'Erreur inconnue'; }
}
async function toggleQrCodeNotification(qr: CompanyQrCode, channel: keyof NotificationPreferences) {
  const current = qr.notificationPreferences || { whatsappEnabled: true, emailEnabled: true, telegramEnabled: true };
  const updated = await updateQrCodeNotifications(qr._id, { ...current, [channel]: !current[channel] });
  qrCodes.value = qrCodes.value.map((item) => item._id === updated._id ? { ...item, notificationPreferences: updated.notificationPreferences } : item);
}
async function copyText(value: string, message = 'Lien copié.') {
  try { await navigator.clipboard.writeText(value); } catch { const input = document.createElement('textarea'); input.value = value; document.body.appendChild(input); input.select(); document.execCommand('copy'); document.body.removeChild(input); }
  showToast(message, 'success');
}
function getWidgetScript(qr: CompanyQrCode) { const origin = window.location.origin; return `<script src="${origin}/feedback-widget.js" data-feedback-url="${qr.feedbackUrl}" data-button-text="Feedback" defer></` + 'script>'; }
async function copyWidgetScript(qr: CompanyQrCode) { await copyText(getWidgetScript(qr), 'Script d integration copie.'); }
function downloadQrCode(qr: CompanyQrCode) { const link = document.createElement('a'); link.href = qr.qrCodeDataUrl; link.download = `qr-code-${qr.slug}.png`; link.click(); }
onMounted(loadQrCodes);
</script>

<template>
  <section class="grid gap-6">
    <form class="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:grid-cols-[1fr_auto]" @submit.prevent="submitQrCode">
      <label><span class="mb-2 block font-black text-ink">Libellé du QR code</span><input v-model="qrForm.label" placeholder="Caisse, table 1, agence..." class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" /></label>
      <button class="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-black text-white"><Plus :size="18" /> Créer</button>
      <p v-if="qrMessage" class="md:col-span-2 rounded-xl px-4 py-3 text-sm font-bold" :class="qrMessage.includes('créé') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ qrMessage }}</p>
    </form>

    <div class="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      <article v-for="qr in qrCodes" :key="qr._id" class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:grid-cols-[88px_1fr]">
        <div class="grid place-items-center rounded-xl bg-slate-50 p-2"><img :src="qr.qrCodeDataUrl" alt="QR Code" class="h-20 w-20 rounded-lg bg-white object-contain" /></div>
        <div class="flex min-w-0 flex-col"><div class="min-w-0"><div class="flex flex-wrap items-start justify-between gap-2"><h3 class="max-w-full truncate text-base font-black text-ink">{{ qr.label || 'QR Code' }}</h3><span class="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-black text-brand-700">{{ qr.reviewCount }} avis</span></div>
          <details class="mt-2 mb-2 max-w-xs rounded-xl border border-slate-200 bg-white"><summary class="flex h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-sm font-black text-ink marker:hidden"><span class="inline-flex items-center gap-2"><MessageSquareText :size="15" /> Notifications</span><ChevronDown :size="17" /></summary><div class="grid gap-2 border-t border-slate-200 p-2 sm:grid-cols-2"><button class="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition" :class="qrNotifications(qr).telegramEnabled ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-500'" type="button" @click="toggleQrCodeNotification(qr, 'telegramEnabled')"><Send :size="16" /> Telegram</button><button class="inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition" :class="qrNotifications(qr).emailEnabled ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-500'" type="button" @click="toggleQrCodeNotification(qr, 'emailEnabled')"><Mail :size="16" /> Email</button></div></details></div>
          <div class="mt-3 flex flex-wrap gap-2 sm:mt-auto"><RouterLink class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-ink transition hover:bg-slate-50" :to="{ path: '/ai', query: { qrCodeId: qr._id } }" title="Analyser ce QR Code" aria-label="Analyser ce QR Code"><Eye :size="16" /></RouterLink><button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-ink transition hover:bg-slate-50" title="Copier le lien" aria-label="Copier le lien" @click="copyText(qr.feedbackUrl)"><Copy :size="16" /></button><button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-ink transition hover:bg-slate-50" title="Copier le script" aria-label="Copier le script" @click="copyWidgetScript(qr)"><Code2 :size="16" /></button><button class="grid h-10 w-10 place-items-center rounded-xl bg-brand-700 text-white transition hover:bg-brand-600" title="Télécharger le QR Code" aria-label="Télécharger le QR Code" @click="downloadQrCode(qr)"><Download :size="16" /></button></div>
        </div>
      </article>
      <p v-if="!qrCodes.length" class="rounded-2xl bg-slate-50 p-6 font-bold text-slate-600">Aucun QR Code créé pour le moment.</p>
    </div>
    <BasePagination :pagination="qrCodePagination" :page="qrCodePage" label="QR Code au total" @page-change="goQrCodePage" />
  </section>
</template>
