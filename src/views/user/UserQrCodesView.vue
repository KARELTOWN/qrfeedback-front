<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { BarChart3, CheckCircle2, Code2, Copy, Download, Eye, Mail, MessageSquareText, Pencil, Plus, Power, QrCode, Send, Star, XCircle } from 'lucide-vue-next';
import BasePagination from '../../components/shared/BasePagination.vue';
import { useDashboard, type CompanyQrCode, type NotificationPreferences, type PaginationMeta, type Review } from '../../composables/useDashboard';
import { useToast } from '../../composables/useToast';

const { getQrCodes, getReviews, createQrCode, updateQrCode, disableQrCode, updateQrCodeNotifications, downloadQrCodeAsset } = useDashboard();
const { showToast } = useToast();
const emptyPagination: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };
const qrCodes = ref<CompanyQrCode[]>([]);
const qrCodePagination = ref<PaginationMeta>(emptyPagination);
const qrCodePage = ref(1);
const pageSize = 10;
const qrForm = ref({ label: '' });
const editingQrId = ref('');
const editingLabel = ref('');
const qrMessage = ref('');
const selectedQr = ref<CompanyQrCode | null>(null);
const selectedQrReviews = ref<Review[]>([]);
const selectedQrReviewsLoading = ref(false);
const qrCodeTotalPages = computed(() => qrCodePagination.value.totalPages);

const totalReviews = computed(() => qrCodes.value.reduce((sum, qr) => sum + (qr.reviewCount || 0), 0));
const totalScans = computed(() => qrCodes.value.reduce((sum, qr) => sum + (qr.scanCount || 0), 0));
const activeCount = computed(() => qrCodes.value.filter((qr) => qr.isActive !== false).length);

function qrNotifications(qr: CompanyQrCode) {
  return qr.notificationPreferences || { emailEnabled: true, telegramEnabled: true };
}

function statusLabel(qr: CompanyQrCode) {
  return qr.isActive === false ? 'Inactif' : 'Actif';
}

function statusClass(qr: CompanyQrCode) {
  return qr.isActive === false ? 'bg-slate-100 text-slate-700 ring-slate-200' : 'bg-emerald-50 text-emerald-700 ring-emerald-100';
}

function ratingClass(rating = 0) {
  if (rating >= 4) return 'text-emerald-700';
  if (rating >= 3) return 'text-amber-700';
  if (rating > 0) return 'text-rose-700';
  return 'text-slate-500';
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
}

async function loadQrCodes() {
  const result = await getQrCodes(qrCodePage.value, pageSize);
  qrCodes.value = result.qrCodes;
  qrCodePagination.value = result.pagination;
  if (selectedQr.value) {
    const updated = result.qrCodes.find((qr) => qr._id === selectedQr.value?._id);
    if (updated) selectedQr.value = updated;
  }
}

async function goQrCodePage(page: number) {
  qrCodePage.value = Math.min(Math.max(page, 1), qrCodeTotalPages.value);
  await loadQrCodes();
}

async function submitQrCode() {
  qrMessage.value = '';
  try {
    await createQrCode({ label: qrForm.value.label || undefined });
    qrCodePage.value = 1;
    await loadQrCodes();
    qrForm.value = { label: '' };
    qrMessage.value = 'QR Code créé.';
  } catch (err) {
    qrMessage.value = err instanceof Error ? err.message : 'Erreur inconnue';
  }
}

async function toggleQrCodeNotification(qr: CompanyQrCode, channel: keyof NotificationPreferences) {
  const current = qr.notificationPreferences || { emailEnabled: true, telegramEnabled: true };
  const updated = await updateQrCodeNotifications(qr._id, { ...current, [channel]: !current[channel] });
  qrCodes.value = qrCodes.value.map((item) => item._id === updated._id ? { ...item, notificationPreferences: updated.notificationPreferences } : item);
  if (selectedQr.value?._id === updated._id) selectedQr.value = { ...selectedQr.value, notificationPreferences: updated.notificationPreferences };
}

function startEdit(qr: CompanyQrCode) {
  editingQrId.value = qr._id;
  editingLabel.value = qr.label || '';
}

async function saveEdit(qr: CompanyQrCode) {
  const updated = await updateQrCode(qr._id, { label: editingLabel.value || undefined });
  qrCodes.value = qrCodes.value.map((item) => item._id === updated._id ? { ...item, label: updated.label } : item);
  if (selectedQr.value?._id === updated._id) selectedQr.value = { ...selectedQr.value, label: updated.label };
  editingQrId.value = '';
  showToast('QR Code mis à jour.', 'success');
}

async function toggleActive(qr: CompanyQrCode) {
  const updated = qr.isActive === false ? await updateQrCode(qr._id, { isActive: true }) : await disableQrCode(qr._id);
  qrCodes.value = qrCodes.value.map((item) => item._id === updated._id ? { ...item, isActive: updated.isActive, disabledAt: updated.disabledAt } : item);
  if (selectedQr.value?._id === updated._id) selectedQr.value = { ...selectedQr.value, isActive: updated.isActive, disabledAt: updated.disabledAt };
  showToast(updated.isActive === false ? 'QR Code désactivé.' : 'QR Code activé.', 'success');
}

async function copyText(value: string, message = 'Lien copié.') {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const input = document.createElement('textarea');
    input.value = value;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
  showToast(message, 'success');
}

function getWidgetScript(qr: CompanyQrCode) {
  const origin = window.location.origin;
  return `<script src="${origin}/feedback-widget.js" data-feedback-url="${qr.feedbackUrl}" data-button-text="Donner un avis" defer></` + 'script>';
}

async function copyWidgetScript(qr: CompanyQrCode) {
  await copyText(getWidgetScript(qr), "Script d'intégration copié.");
}

async function downloadQrCode(qr: CompanyQrCode, format: 'png' | 'pdf') {
  const blob = await downloadQrCodeAsset(qr._id, format);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `qr-code-${qr.slug}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}

async function openQrDetail(qr: CompanyQrCode) {
  selectedQr.value = qr;
  selectedQrReviews.value = [];
  selectedQrReviewsLoading.value = true;
  try {
    const result = await getReviews(1, 6, { qrCodeId: qr._id });
    selectedQrReviews.value = result.reviews;
  } finally {
    selectedQrReviewsLoading.value = false;
  }
}

onMounted(loadQrCodes);
</script>

<template>
  <section class="grid gap-6">
    <header class="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:grid-cols-[1fr_420px]">
      <div>
        <p class="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-black text-brand-700">
          <QrCode :size="16" />
          QR codes
        </p>
        <h2 class="mt-3 text-3xl font-black text-ink">Points de collecte</h2>
        <p class="mt-2 max-w-2xl font-semibold leading-7 text-slate-600">
          Créez un QR par table, agence, comptoir ou canal. Chaque QR garde ses propres scans, avis et notifications.
        </p>
        <div class="mt-5 grid gap-3 sm:grid-cols-3">
          <div class="rounded-2xl bg-slate-50 p-4">
            <span class="text-xs font-black uppercase text-slate-500">QR actifs</span>
            <strong class="mt-1 block text-2xl font-black text-ink">{{ activeCount }}</strong>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <span class="text-xs font-black uppercase text-slate-500">Avis</span>
            <strong class="mt-1 block text-2xl font-black text-ink">{{ totalReviews }}</strong>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4">
            <span class="text-xs font-black uppercase text-slate-500">Scans</span>
            <strong class="mt-1 block text-2xl font-black text-ink">{{ totalScans }}</strong>
          </div>
        </div>
      </div>

      <form class="rounded-2xl border border-slate-200 bg-slate-50 p-4" @submit.prevent="submitQrCode">
        <label class="block">
          <span class="mb-2 block font-black text-ink">Nouveau QR code</span>
          <input v-model="qrForm.label" placeholder="Caisse, table 1, agence..." class="h-12 w-full rounded-xl border border-slate-300 px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
        </label>
        <button class="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-black text-white transition hover:bg-brand-600">
          <Plus :size="18" />
          Créer le QR
        </button>
        <p v-if="qrMessage" class="mt-3 rounded-xl px-4 py-3 text-sm font-bold" :class="qrMessage.includes('créé') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ qrMessage }}</p>
      </form>
    </header>

    <div class="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
      <article v-for="qr in qrCodes" :key="qr._id" class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-100 hover:shadow-md">
        <div class="flex gap-4">
          <button class="grid h-28 w-28 shrink-0 place-items-center rounded-2xl bg-slate-50 p-2 ring-1 ring-slate-100" title="Voir le détail" @click="openQrDetail(qr)">
            <img :src="qr.qrCodeDataUrl" alt="QR Code" class="h-24 w-24 rounded-xl bg-white object-contain" />
          </button>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="truncate text-lg font-black text-ink">{{ qr.label || 'QR Code' }}</h3>
                <p class="mt-1 truncate text-sm font-bold text-slate-500">{{ qr.slug }}</p>
              </div>
              <span class="rounded-full px-3 py-1 text-xs font-black ring-1" :class="statusClass(qr)">
                {{ statusLabel(qr) }}
              </span>
            </div>

            <div class="mt-4 grid grid-cols-3 gap-2 text-center">
              <div class="rounded-xl bg-slate-50 px-2 py-3">
                <strong class="block text-lg font-black text-ink">{{ qr.reviewCount || 0 }}</strong>
                <span class="text-xs font-black text-slate-500">avis</span>
              </div>
              <div class="rounded-xl bg-slate-50 px-2 py-3">
                <strong class="block text-lg font-black text-ink">{{ qr.scanCount || 0 }}</strong>
                <span class="text-xs font-black text-slate-500">scans</span>
              </div>
              <div class="rounded-xl bg-slate-50 px-2 py-3">
                <strong class="block text-lg font-black" :class="ratingClass(qr.averageRating)">{{ qr.averageRating || 0 }}/5</strong>
                <span class="text-xs font-black text-slate-500">note</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="editingQrId === qr._id" class="mt-4 flex gap-2">
          <input v-model="editingLabel" class="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-3 font-bold outline-none focus:border-brand-700" />
          <button class="h-11 rounded-xl bg-brand-700 px-4 font-black text-white" @click="saveEdit(qr)">OK</button>
        </div>

        <div class="mt-4 grid gap-2 sm:grid-cols-2">
          <button class="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition" :class="qrNotifications(qr).telegramEnabled ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'" type="button" @click="toggleQrCodeNotification(qr, 'telegramEnabled')">
            <Send :size="16" />
            Telegram
          </button>
          <button class="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-sm font-black transition" :class="qrNotifications(qr).emailEnabled ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-slate-500'" type="button" @click="toggleQrCodeNotification(qr, 'emailEnabled')">
            <Mail :size="16" />
            Email
          </button>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <button class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 font-black text-ink transition hover:bg-slate-50" @click="openQrDetail(qr)">
            <Eye :size="16" />
            Détail
          </button>
          <RouterLink class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 font-black text-ink transition hover:bg-slate-50" :to="{ path: '/ai', query: { qrCodeId: qr._id } }">
            <BarChart3 :size="16" />
            Analyse
          </RouterLink>
          <button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-ink transition hover:bg-slate-50" title="Modifier le libellé" aria-label="Modifier le libellé" @click="startEdit(qr)"><Pencil :size="16" /></button>
          <button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-ink transition hover:bg-slate-50" title="Activer ou désactiver" aria-label="Activer ou désactiver" @click="toggleActive(qr)"><Power :size="16" /></button>
          <button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-ink transition hover:bg-slate-50" title="Copier le lien" aria-label="Copier le lien" @click="copyText(qr.feedbackUrl)"><Copy :size="16" /></button>
          <button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-ink transition hover:bg-slate-50" title="Copier le script" aria-label="Copier le script" @click="copyWidgetScript(qr)"><Code2 :size="16" /></button>
          <button class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-700 px-3 font-black text-white transition hover:bg-brand-600" title="Télécharger PNG" @click="downloadQrCode(qr, 'png')"><Download :size="16" /> PNG</button>
          <button class="h-10 rounded-xl bg-slate-900 px-3 text-sm font-black text-white transition hover:bg-black" title="Télécharger PDF" @click="downloadQrCode(qr, 'pdf')">PDF</button>
        </div>
      </article>

      <div v-if="!qrCodes.length" class="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <strong class="block text-xl font-black text-ink">Aucun QR Code créé.</strong>
        <span class="mt-2 block font-semibold text-slate-500">Créez votre premier QR pour commencer à recevoir des avis.</span>
      </div>
    </div>

    <BasePagination :pagination="qrCodePagination" :page="qrCodePage" label="QR Code au total" @page-change="goQrCodePage" />

    <div v-if="selectedQr" class="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4" @click.self="selectedQr = null">
      <div class="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
        <div class="mb-5 flex items-start justify-between gap-4">
          <div>
            <p class="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-sm font-black text-brand-700">
              <QrCode :size="15" />
              Détail QR code
            </p>
            <h2 class="text-2xl font-black text-ink">{{ selectedQr.label || 'QR Code' }}</h2>
            <p class="mt-1 break-all text-sm font-bold text-slate-500">{{ selectedQr.feedbackUrl }}</p>
          </div>
          <button class="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-ink" aria-label="Fermer" @click="selectedQr = null"><XCircle :size="18" /></button>
        </div>

        <div class="grid gap-5 lg:grid-cols-[220px_1fr]">
          <div class="rounded-2xl bg-slate-50 p-5 text-center">
            <img :src="selectedQr.qrCodeDataUrl" alt="QR Code" class="mx-auto h-44 w-44 rounded-2xl bg-white object-contain p-2 ring-1 ring-slate-100" />
            <span class="mt-4 inline-flex rounded-full px-3 py-1 text-sm font-black ring-1" :class="statusClass(selectedQr)">{{ statusLabel(selectedQr) }}</span>
          </div>

          <div class="grid gap-4">
            <div class="grid gap-3 sm:grid-cols-4">
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-xs font-black uppercase text-slate-500">Avis</p>
                <strong class="mt-1 block text-2xl font-black text-ink">{{ selectedQr.reviewCount || 0 }}</strong>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-xs font-black uppercase text-slate-500">Scans</p>
                <strong class="mt-1 block text-2xl font-black text-ink">{{ selectedQr.scanCount || 0 }}</strong>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-xs font-black uppercase text-slate-500">Conversion</p>
                <strong class="mt-1 block text-2xl font-black text-ink">{{ selectedQr.conversionRate || 0 }}%</strong>
              </div>
              <div class="rounded-2xl bg-slate-50 p-4">
                <p class="text-xs font-black uppercase text-slate-500">Note</p>
                <strong class="mt-1 block text-2xl font-black" :class="ratingClass(selectedQr.averageRating)">{{ selectedQr.averageRating || 0 }}/5</strong>
              </div>
            </div>

            <div class="flex flex-wrap gap-2">
              <button class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 font-black text-ink transition hover:bg-slate-50" @click="copyText(selectedQr.feedbackUrl)">
                <Copy :size="16" />
                Copier le lien
              </button>
              <button class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-700 px-3 font-black text-white transition hover:bg-brand-600" @click="downloadQrCode(selectedQr, 'png')">
                <Download :size="16" />
                PNG
              </button>
              <button class="h-10 rounded-xl bg-slate-900 px-3 text-sm font-black text-white transition hover:bg-black" @click="downloadQrCode(selectedQr, 'pdf')">PDF imprimable</button>
              <RouterLink class="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 font-black text-ink transition hover:bg-slate-50" :to="{ path: '/ai', query: { qrCodeId: selectedQr._id } }">
                <BarChart3 :size="16" />
                Analyse IA
              </RouterLink>
            </div>
          </div>
        </div>

        <section class="mt-6 rounded-2xl border border-slate-200 p-5">
          <div class="mb-4 flex items-center justify-between gap-3">
            <h3 class="text-xl font-black text-ink">Derniers avis liés à ce QR</h3>
            <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600">{{ selectedQrReviews.length }} affiché(s)</span>
          </div>
          <div v-if="selectedQrReviewsLoading" class="rounded-xl bg-slate-50 p-4 font-bold text-slate-500">Chargement des avis...</div>
          <div v-else class="grid gap-3">
            <article v-for="review in selectedQrReviews" :key="review._id" class="rounded-2xl bg-slate-50 p-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="inline-flex items-center gap-1 font-black" :class="ratingClass(review.rating)"><Star :size="15" /> {{ review.rating }}/5</span>
                <span class="text-sm font-bold text-slate-500">{{ formatDate(review.createdAt) }}</span>
              </div>
              <p class="mt-2 line-clamp-3 font-semibold leading-7 text-slate-700">{{ review.serviceFeedback || 'Aucun commentaire principal.' }}</p>
            </article>
            <p v-if="!selectedQrReviews.length" class="rounded-xl bg-slate-50 p-4 font-bold text-slate-500">Aucun avis récent pour ce QR.</p>
          </div>
        </section>
      </div>
    </div>
  </section>
</template>
