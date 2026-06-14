<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { KeyRound, LogOut, QrCode } from 'lucide-vue-next';

withDefaults(defineProps<{
  activePage: string;
  companyName: string;
  navItems: Array<{ key: string; label: string; icon: unknown; to: string; badge?: string }>;
  mode?: 'desktop' | 'mobile';
}>(), {
  mode: 'desktop'
});

defineEmits<{
  logout: [];
  navigate: [];
}>();
</script>

<template>
  <aside class="border-r border-slate-200 bg-white" :class="mode === 'desktop' ? 'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[336px] lg:flex-col lg:overflow-hidden' : 'flex h-full w-[min(336px,86vw)] flex-col overflow-hidden'">
    <div class="px-5 py-5">
      <RouterLink to="/" class="flex items-center gap-3 text-2xl font-black text-ink" @click="$emit('navigate')">
        <span class="grid h-11 w-11 place-items-center rounded-full bg-brand-700 text-white"><QrCode :size="23" /></span>
        QR Feedback
        <span class="rounded-full border border-slate-300 px-2 py-0.5 text-xs font-bold text-slate-500">Beta</span>
      </RouterLink>
    </div>
    <div class="mx-5 border-t border-slate-200 pt-7">
      <div class="flex min-h-16 w-full items-center rounded-xl border border-slate-300 bg-white px-4 font-black text-ink">
        <span class="flex min-w-0 items-center gap-3">
          <span class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black text-white"><KeyRound :size="20" /></span>
          <span class="truncate">{{ companyName }}</span>
        </span>
      </div>
    </div>
    <nav class="mt-5 flex-1 space-y-2 overflow-y-auto px-5 pb-4">
      <RouterLink v-for="item in navItems" :key="item.key" :to="item.to" class="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-base font-bold transition" :class="activePage === item.key ? 'bg-brand-100 text-brand-700' : 'text-slate-700 hover:bg-slate-100'" @click="$emit('navigate')">
        <component :is="item.icon" :size="22" />
        <span class="flex-1">{{ item.label }}</span>
        <span v-if="item.badge" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700">{{ item.badge }}</span>
      </RouterLink>
    </nav>
    <button class="mt-auto flex h-14 shrink-0 items-center gap-3 border-t border-slate-200 px-6 font-bold text-slate-700" @click="$emit('logout')">
      <LogOut :size="20" /> Deconnexion
    </button>
  </aside>
</template>
