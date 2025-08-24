<template>
  <div class="option-item flex items-center gap-3 p-3 rounded-xl bg-white border">
    <button class="px-2 py-1 text-xs text-gray-500" @click.prevent="emitMoveUp" :disabled="index===0">▲</button>
    <button class="px-2 py-1 text-xs text-gray-500" @click.prevent="emitMoveDown">▼</button>
    <input v-model="local.text" class="flex-1 border rounded px-3 py-2 text-sm" placeholder="Option text" />
    <input type="color" v-model="local.color" class="w-10 h-8 p-0 border-0 rounded" />
    <button class="px-3 py-1 text-xs text-red-500" @click.prevent="emitRemove">×</button>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
const props = defineProps<{ option: { text: string; color?: string }, index: number }>();
const emit = defineEmits<{ update: (opt: any, idx: number) => void; remove: (idx: number) => void; moveUp: (idx: number) => void; moveDown: (idx: number) => void }>();

const local = reactive({ text: props.option.text || '', color: props.option.color || '#F3F4F6' });
watch(local, () => emit('update', { text: local.text, color: local.color }, props.index));

const emitRemove = () => emit('remove', props.index);
const emitMoveUp = () => { if (props.index > 0) emit('moveUp', props.index); };
const emitMoveDown = () => emit('moveDown', props.index);
</script>

<style scoped>
.option-item { align-items: center; }
input[type="color"] { border: none; padding: 0; }
</style>
