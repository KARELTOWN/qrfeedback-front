<script setup lang="ts">
import { Search } from 'lucide-vue-next';
import { useAdminContext } from '../../composables/useAdminContext';

const ctx = useAdminContext();
const { usersPagination, usersSearch, users, openUser, resetPassword, toggleUser, usersPage, goUsersPage, Eye, KeyRound, Power, BasePagination } = ctx;
</script>

<template>
  <section class="grid gap-5">
    <div class="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 class="text-2xl font-black text-ink">Utilisateurs</h2>
          <p class="mt-1 font-semibold text-slate-500">Gérez les comptes actifs, ouvrez une fiche entreprise ou régénérez un accès.</p>
        </div>
        <span class="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-600">{{ usersPagination.total }} comptes</span>
      </div>
      <div class="relative mt-4 max-w-xl">
        <Search class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" :size="18" />
        <input v-model="usersSearch" placeholder="Rechercher par entreprise ou email" class="h-12 w-full rounded-xl border border-slate-300 pl-11 pr-4 font-bold outline-none focus:border-brand-700 focus:ring-4 focus:ring-brand-100" />
      </div>
    </div>

    <div class="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-[1120px] w-full border-collapse text-left">
        <thead class="bg-slate-50"><tr><th class="px-5 py-4 text-sm font-black text-black">Entreprise</th><th class="px-5 py-4 text-sm font-black text-black">Email</th><th class="px-5 py-4 text-sm font-black text-black">Avis collectés</th><th class="px-5 py-4 text-sm font-black text-black">Statut</th><th class="px-5 py-4 text-sm font-black text-black">Actions</th></tr></thead>
        <tbody>
          <tr v-for="user in users" :key="user._id" class="border-t border-slate-200 transition hover:bg-slate-50">
            <td class="px-5 py-4 font-black text-ink">{{ user.company?.name || '-' }}</td>
            <td class="px-5 py-4 font-semibold text-slate-600">{{ user.email }}</td>
            <td class="px-5 py-4 font-black text-ink">{{ user.reviewsCount || 0 }}</td>
            <td class="px-5 py-4"><span class="rounded-full px-3 py-1 text-sm font-black" :class="user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">{{ user.isActive ? 'Actif' : 'Désactivé' }}</span></td>
            <td class="px-5 py-4">
              <div class="flex flex-wrap gap-2">
                <button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-ink" title="Voir" @click="openUser(user)"><Eye :size="17" /></button>
                <button class="grid h-10 w-10 place-items-center rounded-xl border border-slate-300 text-ink transition hover:bg-slate-100" title="Generer un mot de passe" aria-label="Generer un mot de passe" @click="resetPassword(user)"><KeyRound :size="17" /></button>
                <button class="grid h-10 w-10 place-items-center rounded-xl text-white transition" :class="user.isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-brand-700 hover:bg-brand-600'" :title="user.isActive ? 'Desactiver' : 'Activer'" :aria-label="user.isActive ? 'Desactiver' : 'Activer'" @click="toggleUser(user)"><Power :size="17" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="!users.length">
            <td colspan="5" class="px-5 py-10 text-center font-bold text-slate-500">Aucun utilisateur.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <BasePagination :pagination="usersPagination" :page="usersPage" label="utilisateur(s) au total" @page-change="goUsersPage" />
  </section>
</template>
