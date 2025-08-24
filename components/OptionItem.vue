<template>
  <div class="option-item flex items-center gap-3 p-3 rounded-xl bg-white border">
    <span class="drag-handle cursor-grab px-2">☰</span>
    <input v-model="local.text" class="flex-1 border rounded px-3 py-2 text-sm" placeholder="Option text" />
    <input type="color" v-model="local.color" class="w-10 h-8 p-0 border-0 rounded" />
    <button class="px-3 py-1 text-xs text-red-500" @click.prevent="emitRemove">×</button>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
const props = defineProps<{ option: { id?: string; text: string; color?: string }, index?: number }>();
const emit = defineEmits<{ update: (opt: any, id?: string) => void; remove: (id: string) => void }>();

const local = reactive({ text: props.option.text || '', color: props.option.color || '#F3F4F6' });
watch(local, () => emit('update', { id: props.option.id, text: local.text, color: local.color }));

const emitRemove = () => { if (props.option.id) emit('remove', props.option.id); };
</script>

<style scoped>
.option-item { align-items: center; }
input[type="color"] { border: none; padding: 0; }
</style>
