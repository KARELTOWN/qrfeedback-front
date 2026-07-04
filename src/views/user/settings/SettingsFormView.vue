<script setup lang="ts">
import { onMounted, ref } from 'vue';
import FeedbackFormSettings from '../../../components/user/FeedbackFormSettings.vue';
import { useDashboard, type FeedbackFormConfig } from '../../../composables/useDashboard';

const { getFeedbackFormConfig, updateFeedbackFormConfig } = useDashboard();
const formConfig = ref<FeedbackFormConfig | null>(null);
const formConfigMessage = ref('');

async function saveFormConfig() {
  if (!formConfig.value) return;
  formConfigMessage.value = '';
  try {
    formConfig.value = await updateFeedbackFormConfig(formConfig.value);
    formConfigMessage.value = 'Configuration enregistrée.';
  } catch (err) { formConfigMessage.value = err instanceof Error ? err.message : 'Erreur inconnue'; }
}

onMounted(async () => {
  formConfig.value = await getFeedbackFormConfig();
});
</script>

<template>
  <FeedbackFormSettings :model-value="formConfig" :message="formConfigMessage" @save="saveFormConfig" />
</template>
