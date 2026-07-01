<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import SUNEDITOR from 'suneditor';
import 'suneditor/dist/css/suneditor.min.css';

const props = defineProps<{ modelValue: string; placeholder?: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const element = ref<HTMLTextAreaElement | null>(null);
let editor: ReturnType<typeof SUNEDITOR.create> | null = null;

onMounted(() => {
  if (!element.value) return;
  editor = SUNEDITOR.create(element.value, {
    height: '300px',
    placeholder: props.placeholder || 'Rédigez le contenu du modèle…',
    buttonList: [['undo', 'redo'], ['formatBlock', 'fontSize'], ['bold', 'underline', 'italic'], ['fontColor', 'hiliteColor'], ['align', 'list'], ['link', 'image'], ['removeFormat'], ['codeView']],
  });
  editor.setContents(props.modelValue || '');
  editor.onChange = (content: string) => emit('update:modelValue', content);
});

watch(() => props.modelValue, (value) => {
  if (editor && editor.getContents(true) !== value) editor.setContents(value || '');
});

function insertText(value: string) {
  editor?.insertHTML(value);
}

defineExpose({ insertText });
onBeforeUnmount(() => editor?.destroy());
</script>

<template><textarea ref="element" /></template>
