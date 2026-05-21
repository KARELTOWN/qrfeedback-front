<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { ChevronDown, KeyRound, LogOut, QrCode } from 'lucide-vue-next';

defineProps<{
  activeTab: string;
  companyName: string;
  navItems: Array<{ key: string; label: string; icon: unknown; badge?: string }>;
}>();

defineEmits<{
  select: [tab: string];
  logout: [];
}>();
</script>

<template>
  <aside class="hidden border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[336px] lg:flex-col lg:overflow-hidden">
    <div class="px-5 py-5">
      <RouterLink to="/" class="flex items-center gap-3 text-2xl font-black text-ink">
        <span class="grid h-11 w-11 place-items-center rounded-full bg-brand-700 text-white"><QrCode :size="23" /></span>
        QR Feedback
        <span class="rounded-full border border-slate-300 px-2 py-0.5 text-xs font-bold text-slate-500">Beta</span>
      </RouterLink>
    </div>
    <div class="mx-5 border-t border-slate-200 pt-7">
      <button class="flex h-16 w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 font-black text-ink">
        <span class="flex items-center gap-3">
          <span class="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><KeyRound :size="20" /></span>
          {{ companyName }}
        </span>
        <ChevronDown :size="20" />
      </button>
    </div>
    <nav class="mt-5 flex-1 space-y-2 overflow-y-auto px-5 pb-4">
      <button v-for="item in navItems" :key="item.key" class="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-base font-bold transition" :class="activeTab === item.key ? 'bg-brand-100 text-brand-700' : 'text-slate-700 hover:bg-slate-100'" @click="$emit('select', item.key)">
        <component :is="item.icon" :size="22" />
        <span class="flex-1">{{ item.label }}</span>
        <span v-if="item.badge" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700">{{ item.badge }}</span>
      </button>
    </nav>
    <button class="mt-auto flex h-14 shrink-0 items-center gap-3 border-t border-slate-200 px-6 font-bold text-slate-700" @click="$emit('logout')">
      <LogOut :size="20" /> Deconnexion
    </button>
  </aside>
</template>
