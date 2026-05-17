<script setup lang="ts">
import { ref } from 'vue';
import { Eye, EyeOff, Lock } from 'lucide-vue-next';

withDefaults(defineProps<{
  modelValue: string;
  placeholder?: string;
  inputClass?: string;
  minlength?: string | number;
  required?: boolean;
}>(), {
  placeholder: 'Mot de passe',
  inputClass: 'h-16',
  minlength: undefined,
  required: false
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const visible = ref(false);
</script>

<template>
  <span class="relative block">
    <Lock :size="22" class="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
    <input
      :value="modelValue"
      :type="visible ? 'text' : 'password'"
      :placeholder="placeholder"
      :minlength="minlength"
      :required="required"
      class="w-full rounded-xl border border-slate-300 bg-white pl-14 pr-14 text-base font-semibold outline-none transition focus:border-brand-700 focus:ring-4 focus:ring-brand-100"
      :class="inputClass"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      type="button"
      class="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-brand-700"
      :aria-label="visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" :size="20" />
      <Eye v-else :size="20" />
    </button>
  </span>
</template>
