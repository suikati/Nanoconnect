<template>
  <div class="option-list space-y-3">
    <ul class="space-y-2">
      <li
        v-for="(o, idx) in options"
        :key="o.id"
        class="flex items-center gap-3 option-row"
        :class="{ dragging: dragIndex === idx }"
        draggable="true"
        @dragstart="onDragStart(idx, $event)"
        @dragenter.prevent="onDragEnter(idx)"
        @dragover.prevent
        @drop="onDrop(idx, $event)"
        @dragend="onDragEnd"
        aria-grabbed="false"
        aria-dropeffect="move"
      >
        <OptionItem
          :option="o"
          :index="idx"
          @update="onUpdate(idx, $event)"
          @remove="onRemove(idx)"
        />
      </li>
    </ul>
    <div class="pt-2">
      <button class="w-full rounded-xl py-3 text-xs sm:text-sm font-medium bg-primary-50 text-primary-600 hover:bg-primary-100 transition border border-primary-100" @click.prevent="addOption">選択肢を追加</button>
      <p class="mt-2 text-[10px] sm:text-[11px] text-gray-500 flex items-center gap-1"><span class="inline-block w-3 h-3 text-primary-400">⠿</span> ドラッグで並び替えできます</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, toRaw, watch, toRef } from 'vue';
import OptionItem from '~/components/OptionItem.vue';
import type { Choice } from '~/types/models';
const props = defineProps<{ modelValue?: Array<Partial<Choice> & { id?: string }> }>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: Array<{ id: string; text: string; color?: string }> ): void;
}>();

type Opt = { id: string; text: string; color?: string };
// simple palette used for auto-assignment when adding or when incoming items lack color
const palette = ['#4F46E5', '#EC4899', '#F97316', '#10B981', '#06B6D4', '#F59E0B'];

const pickNextColor = (used: Set<string>) => {
  for (const c of palette) if (!used.has(c)) return c;
  // all used -> pick next by cycling
  return palette[used.size % palette.length];
};

// When loading existing modelValue, assign missing colors immediately and try to avoid duplicates
const initial: Opt[] = (() => {
  const items: Array<{ id: string; text: string; color: string }> = (props.modelValue || []).map(
    (o: any, i: number) => ({
      id: o.id || `ch_${Math.random().toString(36).slice(2,10)}`,
      text: o.text || '',
      color: (o.color || '').trim(),
    }),
  );
  const used = new Set<string>();
  return items.map((it: { id: string; text: string; color: string }, idx: number) => {
    if (it.color) {
      used.add(it.color);
      return it;
    }
    const c = pickNextColor(used);
    used.add(c);
    return { ...it, color: c };
  });
})();
const options = reactive(initial as Opt[]);

// Keep local options in sync when parent updates modelValue
const mv = toRef(props, 'modelValue');
watch(
  mv,
  (nv: any) => {
    if (!nv) return;
    const arr = nv as any[];
    // quick equality check: same length and same ids/text
    if (
      arr.length === options.length &&
      arr.every(
        (a, i) =>
          (a.id || '') === (options[i].id || '') &&
          String(a.text || '') === String(options[i].text || ''),
      )
    ) {
      return;
    }
    // replace array while preserving the same reactive object
    const newItems = arr.map((o: any, i: number) => {
      const existing = options[i];
  const id = o.id || (existing && existing.id) || `ch_${Math.random().toString(36).slice(2,10)}`;
      return { id, text: o.text || '', color: o.color || '' };
    });
    options.splice(0, options.length, ...newItems);
  },
  { deep: true },
);

const addOption = () => {
  const used = new Set<string>(options.map((o: Opt) => (o.color || '').toString()).filter(Boolean));
  const color = pickNextColor(used);
  options.push({ id: `ch_${Math.random().toString(36).slice(2,10)}`, text: '', color });
  emit('update:modelValue', toRaw(options));
};

// Up/Down ボタンは廃止（ドラッグのみ）

const onUpdate = (idx: number, opt: any) => {
  if (idx >= 0 && idx < options.length) {
    options[idx] = opt;
    emit('update:modelValue', toRaw(options));
  }
};
const onRemove = (idx: number) => {
  if (idx >= 0 && idx < options.length) {
    options.splice(idx, 1);
    emit('update:modelValue', toRaw(options));
  }
};

const emitUpdate = () => {
  emit('update:modelValue', toRaw(options));
};

// Drag & Drop
let dragIndex: number | null = null;
function onDragStart(i: number, ev: DragEvent) {
  dragIndex = i;
  (ev.target as HTMLElement)?.classList.add('drag-origin');
  try { ev.dataTransfer?.setData('text/plain', String(i)); } catch (e) { /* ignore */ }
  try { ev.dataTransfer!.effectAllowed = 'move'; } catch (e) { /* ignore */ }
}
function onDragEnter(i: number) {
  // show placeholder effect by reordering preview? keep simple highlight only
}
function onDrop(i: number, ev: DragEvent) {
  let from = dragIndex;
  if (from == null) {
    try { const d = ev.dataTransfer?.getData('text/plain'); if (d) from = Number(d); } catch (e) { /* ignore */ }
  }
  if (from == null || from === i) { dragIndex = null; return; }
  const [item] = options.splice(from, 1);
  options.splice(i, 0, item);
  dragIndex = null;
  emit('update:modelValue', toRaw(options));
}
function onDragEnd(ev: DragEvent) {
  dragIndex = null;
  (ev.target as HTMLElement)?.classList.remove('drag-origin');
}

// Note: do not auto-emit from watching `options` to avoid recursive update loops.
</script>

<style scoped>
.option-list {
  display: block;
}
</style>
