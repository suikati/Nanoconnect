<template>
  <div class="space-y-2" data-test="slide-sorter">
    <ul class="flex flex-col gap-1">
      <li
        v-for="(s,i) in slides"
        :key="s.id"
        class="group flex items-center gap-2 px-2 py-1 rounded border text-xs sm:text-sm bg-white/70 backdrop-blur hover:bg-white shadow-sm cursor-pointer select-none"
        :class="currentSlideId===s.id ? 'ring-2 ring-primary-300 bg-primary-50/80' : 'border-gray-200'"
        draggable="true"
        @dragstart="onDragStart(i, $event)"
        @dragover.prevent
        @drop="onDrop(i, $event)"
        @click="emit('select', i)"
      >
        <span class="font-mono w-6 text-gray-400">{{ i+1 }}</span>
        <button
          type="button"
            class="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"
            :disabled="i===0"
            @click.stop="emit('move', { from: i, to: i-1 })"
        >▲</button>
        <button
          type="button"
            class="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-30"
            :disabled="i===slides.length-1"
            @click.stop="emit('move', { from: i, to: i+1 })"
        >▼</button>
        <div class="flex-1 truncate" :title="s.title || '(無題)'">{{ s.title || '(無題)' }}</div>
        <span class="text-[10px] text-gray-400">{{ (s.choices||[]).length }}</span>
        <button type="button" class="p-1 rounded text-red-500 hover:bg-red-50" @click.stop="emit('remove', i)">✕</button>
      </li>
    </ul>
    <p v-if="dragHint" class="text-[10px] text-gray-400">{{ dragHint }}</p>
  </div>
</template>

<script setup lang="ts">
interface SlideLike { id: string; title: string; choices: any[] }
const props = defineProps<{ slides: SlideLike[]; currentSlideId?: string | null }>();
const emit = defineEmits<{
  (e: 'move', payload: { from: number; to: number }): void;
  (e: 'select', index: number): void;
  (e: 'remove', index: number): void;
}>();

let dragIndex: number | null = null;
const dragHint = ref('ドラッグまたは▲▼で並び替え');

function onDragStart(i: number, ev: DragEvent) {
  dragIndex = i;
  try { ev.dataTransfer?.setData('text/plain', String(i)); } catch (e) { /* ignore */ }
}
function onDrop(i: number, ev: DragEvent) {
  let from = dragIndex;
  if (from == null) {
    try {
      const d = ev.dataTransfer?.getData('text/plain');
      if (d) from = Number(d);
    } catch (e) { /* ignore */ }
  }
  if (from == null || from === i) return;
  emit('move', { from, to: i });
  dragIndex = null;
}
</script>

<style scoped>
/* 追加の視覚的フィードバックが必要になればここに記述 */
</style>
