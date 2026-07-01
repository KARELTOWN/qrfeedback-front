<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ChevronLeft, ChevronRight, MessageSquareText, Star } from 'lucide-vue-next';
import { useTestimonials, type TestimonialReview } from '../../composables/useTestimonials';

const ROTATE_INTERVAL_MS = 3000;
const route = useRoute();
const { getPublicTestimonials } = useTestimonials();

const companyName = ref('');
const reviews = ref<TestimonialReview[]>([]);
const loading = ref(true);
const error = ref('');
const activeIndex = ref(0);
const rootEl = ref<HTMLElement | null>(null);

const activeReview = computed<TestimonialReview | null>(() => reviews.value[activeIndex.value] || null);

let rotateTimer: ReturnType<typeof setInterval> | null = null;
let resizeObserver: ResizeObserver | null = null;

const slideDirection = ref<'left' | 'right'>('left');

function goTo(index: number) {
  slideDirection.value = index > activeIndex.value ? 'left' : 'right';
  activeIndex.value = index;
}

function prev() {
  slideDirection.value = 'right';
  activeIndex.value = (activeIndex.value - 1 + reviews.value.length) % reviews.value.length;
}

function next() {
  slideDirection.value = 'left';
  activeIndex.value = (activeIndex.value + 1) % reviews.value.length;
}

watch(activeIndex, () => {
  setTimeout(notifyParentHeight, 450);
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function notifyParentHeight() {
  if (!rootEl.value || !window.parent) return;
  window.parent.postMessage({ type: 'qr-feedback-widget-resize', height: rootEl.value.offsetHeight }, '*');
}

function observeHeight() {
  if (!rootEl.value || typeof ResizeObserver === 'undefined') return;
  resizeObserver = new ResizeObserver(notifyParentHeight);
  resizeObserver.observe(rootEl.value);
}

onMounted(async () => {
  try {
    const limit = Number(route.query.limit) || undefined;
    const data = await getPublicTestimonials(route.params.slug, limit);
    companyName.value = data.companyName;
    reviews.value = data.reviews;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Avis indisponibles.';
  } finally {
    loading.value = false;
  }

  if (reviews.value.length > 1) {
    rotateTimer = setInterval(() => {
      slideDirection.value = 'left';
      activeIndex.value = (activeIndex.value + 1) % reviews.value.length;
    }, ROTATE_INTERVAL_MS);
  }

  observeHeight();
  notifyParentHeight();
});

onBeforeUnmount(() => {
  if (rotateTimer) clearInterval(rotateTimer);
  resizeObserver?.disconnect();
});
</script>

<template>
  <main ref="rootEl" class="w-full overflow-hidden bg-transparent p-4 font-sans">
    <div v-if="loading" class="grid place-items-center py-10 text-sm font-semibold text-slate-400">Chargement des avis...</div>
    <div v-else-if="error" class="grid place-items-center py-10 text-sm font-semibold text-red-500">{{ error }}</div>
    <div v-else-if="!reviews.length" class="grid place-items-center py-10 text-sm font-semibold text-slate-400">Aucun avis pour le moment.</div>
    <div v-else class="mx-auto max-w-xl">
      <div class="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-700">
        <MessageSquareText :size="16" />
        {{ companyName }}
      </div>

      <div v-if="reviews.length > 1" class="relative mt-3">
        <button type="button" aria-label="Avis précédent" class="absolute -left-3 top-1/2 z-10 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 active:scale-95" @click="prev">
          <ChevronLeft :size="16" class="text-slate-600" />
        </button>

        <transition :name="slideDirection === 'left' ? 'slide-left' : 'slide-right'" mode="out-in">
          <div :key="activeReview?.id" class="rounded-3xl border border-slate-100 bg-white px-8 py-6 shadow-lg shadow-slate-200/60">
            <div class="flex gap-1 text-amber-400">
              <Star v-for="n in 5" :key="n" :size="18" :fill="n <= (activeReview?.rating || 0) ? 'currentColor' : 'none'" />
            </div>
            <p class="mt-3 font-semibold leading-7 text-slate-700">{{ activeReview?.text || 'Avis sans commentaire.' }}</p>
            <div class="mt-4 flex items-center justify-between text-sm font-bold text-slate-400">
              <span>{{ activeReview?.authorName }}</span>
              <span>{{ formatDate(activeReview?.createdAt || '') }}</span>
            </div>
          </div>
        </transition>

        <button type="button" aria-label="Avis suivant" class="absolute -right-3 top-1/2 z-10 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 active:scale-95" @click="next">
          <ChevronRight :size="16" class="text-slate-600" />
        </button>
      </div>

      <transition v-else :name="slideDirection === 'left' ? 'slide-left' : 'slide-right'" mode="out-in">
        <div :key="activeReview?.id" class="mt-3 rounded-3xl border border-slate-100 bg-white p-6 shadow-lg shadow-slate-200/60">
          <div class="flex gap-1 text-amber-400">
            <Star v-for="n in 5" :key="n" :size="18" :fill="n <= (activeReview?.rating || 0) ? 'currentColor' : 'none'" />
          </div>
          <p class="mt-3 font-semibold leading-7 text-slate-700">{{ activeReview?.text || 'Avis sans commentaire.' }}</p>
          <div class="mt-4 flex items-center justify-between text-sm font-bold text-slate-400">
            <span>{{ activeReview?.authorName }}</span>
            <span>{{ formatDate(activeReview?.createdAt || '') }}</span>
          </div>
        </div>
      </transition>

      <div v-if="reviews.length > 1" class="mt-4 flex justify-center gap-2">
        <button v-for="(review, index) in reviews" :key="review.id" type="button" class="h-2 rounded-full transition-all" :class="index === activeIndex ? 'w-6 bg-brand-700' : 'w-2 bg-slate-300'" :aria-label="`Avis ${index + 1}`" @click="goTo(index)" />
      </div>
    </div>
  </main>
</template>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.35s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-40px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-40px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(40px);
}
</style>
