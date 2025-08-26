<template>
  <div class="option-item flex-1 flex items-center gap-3 p-3 rounded-xl bg-white/80 backdrop-blur border border-primary-100 shadow-sm">
    <input
      v-model="local.text"
      @input="emitLocalUpdate"
      class="flex-1 border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/60 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white/70"
      placeholder="Option text"
    />
    <div class="flex items-center gap-2">
  <button class="text-[10px] sm:text-xs bg-primary-50 text-primary-600 rounded px-2 py-1 hover:bg-primary-100 transition" @click.prevent="$emit('move-up')">↑</button>
  <button class="text-[10px] sm:text-xs bg-primary-50 text-primary-600 rounded px-2 py-1 hover:bg-primary-100 transition" @click.prevent="$emit('move-down')">↓</button>
  <input type="color" v-model="local.color" @change="emitLocalUpdate" class="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
  <button class="px-3 py-1 text-[10px] sm:text-xs text-red-500 hover:bg-red-50 rounded transition" @click.prevent="emitRemove">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import type { Choice } from '~/types/models';
const props = defineProps<{ option: Partial<Choice> & { id?: string }; index?: number }>();
const emit = defineEmits<{
  (e: 'update', opt: { id?: string; text: string; color?: string }): void;
  (e: 'remove', id: string): void;
  (e: 'move-up'): void;
  (e: 'move-down'): void;
}>();

const local = reactive({ text: props.option.text || '', color: props.option.color || '#F3F4F6' });

const emitLocalUpdate = () => {
  const placeholder = '#f3f4f6';
  const origHasColor = typeof props.option.color !== 'undefined' && props.option.color !== null;
  const lc = (local.color || '').toLowerCase();
  const emitColor = !origHasColor && lc === placeholder ? undefined : local.color;
  emit('update', { id: props.option.id, text: local.text, color: emitColor });
};

const emitRemove = () => {
  if (props.option.id) emit('remove', props.option.id);
};
</script>

<style scoped>
.option-item {
  align-items: center;
}
input[type='color'] {
  border: none;
  padding: 0;
}
</style>
