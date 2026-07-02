<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { LogOut, ShieldCheck } from 'lucide-vue-next';

defineProps<{
  activeTab: string;
  navItems: Array<{ key: string; label: string; icon: unknown }>;
}>();

defineEmits<{
  select: [tab: string];
  logout: [];
}>();
</script>

<template>
  <aside class="hidden border-r border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[312px] lg:flex-col">
    <div class="px-5 py-5">
      <RouterLink to="/admin" class="flex items-center" aria-label="Opinbase">
        <img :src="'/assets/logo_600_×_160.png'" alt="Opinbase" class="h-11 w-auto max-w-[180px] object-contain" />
      </RouterLink>
    </div>
    <div class="mx-5 border-t border-slate-200 pt-7">
      <div class="flex h-16 items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 font-black text-ink">
        <span class="grid h-10 w-10 place-items-center rounded-full bg-black text-white"><ShieldCheck :size="20" /></span>
        Superadmin
      </div>
    </div>
    <nav class="mt-5 flex-1 space-y-2 px-5">
      <button v-for="item in navItems" :key="item.key" class="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-base font-bold transition" :class="activeTab === item.key ? 'bg-brand-100 text-brand-700' : 'text-slate-700 hover:bg-slate-100'" @click="$emit('select', item.key)">
        <component :is="item.icon" :size="22" />
        {{ item.label }}
      </button>
    </nav>
    <button class="mt-auto flex h-14 items-center gap-3 border-t border-slate-200 px-6 font-bold text-slate-700" @click="$emit('logout')">
      <LogOut :size="20" /> Deconnexion
    </button>
  </aside>
</template>
