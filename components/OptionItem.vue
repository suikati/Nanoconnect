<template>
  <div class="option-item group flex-1 flex items-center gap-3 p-3 rounded-xl bg-white/80 backdrop-blur border border-primary-100 shadow-sm relative">
  <!-- ドラッグハンドル -->
    <div class="drag-handle select-none text-primary-400/70 group-hover:text-primary-500 flex flex-col justify-center items-center cursor-grab active:cursor-grabbing" title="ドラッグで並び替え" aria-label="並び替えハンドル">
      <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <circle cx="5" cy="5" r="1.5" />
        <circle cx="5" cy="10" r="1.5" />
        <circle cx="5" cy="15" r="1.5" />
        <circle cx="10" cy="5" r="1.5" />
        <circle cx="10" cy="10" r="1.5" />
        <circle cx="10" cy="15" r="1.5" />
      </svg>
    </div>
  <input
      v-model="local.text"
      @input="emitLocalUpdate"
      class="flex-1 border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/60 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white/70"
      placeholder="選択肢"
    />
    <div class="flex items-center gap-2">
      <input type="color" v-model="local.color" @change="emitLocalUpdate" class="w-8 h-8 p-0 border-0 rounded cursor-pointer" />
      <button class="px-3 py-1 text-[10px] sm:text-xs text-red-500 hover:bg-red-50 rounded transition" @click.prevent="emitRemove" aria-label="削除">×</button>
    </div>
    <span class="absolute -top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-primary-50 text-primary-500 font-mono opacity-0 group-hover:opacity-100 transition" aria-hidden="true">drag</span>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import type { Choice } from '~/types/models';
const props = defineProps<{ option: Partial<Choice> & { id?: string }; index?: number }>();
const emit = defineEmits<{
  (e: 'update', opt: { id?: string; text: string; color?: string }): void;
  (e: 'remove', id: string): void;
}>();

// ローカル編集用状態（親に即座に反映しつつ未確定値保持）
const local = reactive({ text: props.option.text || '', color: props.option.color || '#F3F4F6' });

const emitLocalUpdate = () => {
  const placeholder = '#f3f4f6'; // 空色判定用（生成時の初期色）
  const origHasColor = typeof props.option.color !== 'undefined' && props.option.color !== null;
  const lc = (local.color || '').toLowerCase();
  const emitColor = !origHasColor && lc === placeholder ? undefined : local.color;
  emit('update', { id: props.option.id, text: local.text, color: emitColor });
};

const emitRemove = () => {
  if (props.option.id) emit('remove', props.option.id); // id の無い行は生成直後想定で安全上スキップ
};
</script>

<style scoped>
.option-item {
  align-items: center;
}
/* Provide visual feedback when parent <li> is dragging */
:host-context(li.dragging) .option-item {
  outline: 2px dashed var(--color-primary, #6366f1);
  background: rgba(255,255,255,0.92);
  opacity: .85;
}
/* Widen handle hit area */
.drag-handle { width: 1.25rem; }
input[type='color'] {
  border: none;
  padding: 0;
}
</style>
