<script setup lang="ts">
import { reactive, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { ChevronDown, KeyRound, LogOut } from 'lucide-vue-next';

export type NavLeaf = { key: string; label: string; icon: unknown; to: string; badge?: string };
export type NavGroup = { key: string; label: string; icon: unknown; children: Array<{ key: string; label: string; to: string }> };
export type NavEntry = NavLeaf | NavGroup;

const props = withDefaults(defineProps<{
  activePage: string;
  companyName: string;
  navItems: NavEntry[];
  mode?: 'desktop' | 'mobile';
}>(), {
  mode: 'desktop'
});

defineEmits<{
  logout: [];
  navigate: [];
}>();

function isGroup(item: NavEntry): item is NavGroup {
  return 'children' in item;
}

function groupIsActive(item: NavGroup) {
  return item.children.some((child) => child.key === props.activePage);
}

const expandedGroups = reactive<Record<string, boolean>>({});
for (const item of props.navItems) {
  if (isGroup(item)) expandedGroups[item.key] = groupIsActive(item);
}

watch(() => props.activePage, () => {
  for (const item of props.navItems) {
    if (isGroup(item) && groupIsActive(item)) expandedGroups[item.key] = true;
  }
});

function toggleGroup(key: string) {
  expandedGroups[key] = !expandedGroups[key];
}
</script>

<template>
  <aside class="border-r border-slate-200 bg-white" :class="mode === 'desktop' ? 'hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-[336px] lg:flex-col lg:overflow-hidden' : 'flex h-full w-[min(336px,86vw)] flex-col overflow-hidden'">
    <div class="px-5 py-5">
      <RouterLink to="/" class="flex items-center gap-3" aria-label="Opinbase" @click="$emit('navigate')">
        <img :src="'/assets/logo-horizontal.png'" alt="Opinbase" class="h-11 w-auto max-w-[180px] object-contain" />
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
      <template v-for="item in navItems" :key="item.key">
        <RouterLink v-if="!isGroup(item)" :to="item.to" class="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-base font-bold transition" :class="activePage === item.key ? 'bg-brand-100 text-brand-700' : 'text-slate-700 hover:bg-slate-100'" @click="$emit('navigate')">
          <component :is="item.icon" :size="22" />
          <span class="flex-1">{{ item.label }}</span>
          <span v-if="item.badge" class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-700">{{ item.badge }}</span>
        </RouterLink>
        <div v-else>
          <button type="button" class="flex h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-base font-bold transition" :class="groupIsActive(item) ? 'bg-brand-100 text-brand-700' : 'text-slate-700 hover:bg-slate-100'" @click="toggleGroup(item.key)">
            <component :is="item.icon" :size="22" />
            <span class="flex-1">{{ item.label }}</span>
            <ChevronDown :size="18" class="shrink-0 transition-transform" :class="expandedGroups[item.key] ? 'rotate-180' : ''" />
          </button>
          <div v-if="expandedGroups[item.key]" class="ml-6.5 mt-1 space-y-0.5 border-l border-slate-200 pl-4">
            <RouterLink v-for="child in item.children" :key="child.key" :to="child.to" class="flex h-10 items-center rounded-lg px-3 text-sm font-bold transition" :class="activePage === child.key ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'" @click="$emit('navigate')">
              {{ child.label }}
            </RouterLink>
          </div>
        </div>
      </template>
    </nav>
    <button class="mt-auto flex h-14 shrink-0 items-center gap-3 border-t border-slate-200 px-6 font-bold text-slate-700" @click="$emit('logout')">
      <LogOut :size="20" /> Deconnexion
    </button>
  </aside>
</template>
