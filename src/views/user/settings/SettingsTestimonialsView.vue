<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Check, Code2 } from 'lucide-vue-next';
import { useDashboard, type CompanyQrCode } from '../../../composables/useDashboard';
import { useToast } from '../../../composables/useToast';

type TestimonialsSource = 'company' | string;

const { getStats, getQrCodes } = useDashboard();
const { showToast } = useToast();
const companySlug = ref('');
const qrCodes = ref<CompanyQrCode[]>([]);
const testimonialsSource = ref<TestimonialsSource>('company');
const snippetCopied = ref(false);

const activeTestimonialsSlug = computed(() => {
  if (testimonialsSource.value === 'company') return companySlug.value;
  return qrCodes.value.find((qr) => qr._id === testimonialsSource.value)?.slug || '';
});
const testimonialsEmbedUrl = computed(() => `${window.location.origin}/temoignages/${activeTestimonialsSlug.value}`);
const testimonialsSnippet = computed(() => {
  const url = testimonialsEmbedUrl.value;
  const id = `qrf-${activeTestimonialsSlug.value}`;
  return [
    `<iframe src="${url}" id="${id}" width="100%" height="260" style="border:0;overflow:hidden;" loading="lazy" scrolling="no" title="Avis clients"></iframe>`,
    `<script>window.addEventListener('message',function(e){if(e.data&&e.data.type==='qr-feedback-widget-resize'){var f=document.getElementById('${id}');if(f)f.style.height=e.data.height+'px'}})<\/script>`,
  ].join('\n');
});

async function copyTestimonialsSnippet() {
  try {
    await navigator.clipboard.writeText(testimonialsSnippet.value);
  } catch {
    const input = document.createElement('textarea');
    input.value = testimonialsSnippet.value;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }
  snippetCopied.value = true;
  showToast('Code d\'intégration copié.', 'success');
  setTimeout(() => { snippetCopied.value = false; }, 2000);
}

onMounted(async () => {
  const [stats, qrCodesResult] = await Promise.all([getStats(), getQrCodes(1, 100)]);
  companySlug.value = stats.company.slug;
  qrCodes.value = qrCodesResult.qrCodes.filter((qr) => qr.isActive !== false);
});
</script>

<template>
  <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
    <div class="mb-6 flex items-center gap-3">
      <span class="grid h-12 w-12 place-items-center rounded-full bg-brand-700 text-white"><Code2 :size="22" /></span>
      <div>
        <h2 class="text-2xl font-black text-ink">Widget témoignages</h2>
        <p class="mt-1 font-semibold text-slate-500">Affichez un carrousel de vos avis publiés sur votre propre site web, via une iframe à intégrer.</p>
      </div>
    </div>

    <div class="grid gap-5 lg:grid-cols-[320px_1fr]">
      <div class="grid gap-4">
        <label class="block">
          <span class="mb-2 block font-black text-ink">Avis à afficher</span>
          <select v-model="testimonialsSource" class="h-13 w-full rounded-xl border border-slate-300 bg-white px-4 font-semibold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100">
            <option value="company">Tous les avis de l'entreprise</option>
            <option v-for="qr in qrCodes" :key="qr._id" :value="qr._id">{{ qr.label || qr.slug }}</option>
          </select>
        </label>
        <p class="font-semibold text-slate-500">
          Le widget tourne automatiquement entre vos avis publiés et s'adapte à la largeur de son conteneur.
        </p>
      </div>

      <div class="grid min-w-0 gap-4">
        <div class="rounded-2xl border border-slate-200 bg-white p-4">
          <span class="mb-2 block text-sm font-black uppercase text-slate-500">Code à coller sur votre site</span>
          <pre class="max-h-24 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-slate-900 p-3 text-xs font-mono leading-5 text-emerald-200">{{ testimonialsSnippet }}</pre>
          <button class="mt-3 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 font-black text-white transition hover:bg-brand-600" type="button" @click="copyTestimonialsSnippet">
            <component :is="snippetCopied ? Check : Code2" :size="18" />
            {{ snippetCopied ? 'Copié !' : 'Copier le code' }}
          </button>
        </div>
        <a class="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 font-black text-ink transition hover:bg-white" :href="testimonialsEmbedUrl" target="_blank" rel="noreferrer">
          Prévisualiser le widget
        </a>
      </div>
    </div>
  </div>
</template>
