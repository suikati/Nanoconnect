<template>
  <div class="option-list space-y-3">
    <draggable v-model="options" item-key="id" handle=".drag-handle" @update="emitUpdate">
      <template #item="{ element, index }">
        <OptionItem :option="element" :index="index" @update="onUpdate" @remove="onRemove" />
      </template>
    </draggable>
    <div class="pt-2">
      <button class="w-full bg-gray-100 rounded-xl py-3 text-sm text-gray-700" @click.prevent="addOption">+ Add option</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, toRaw } from 'vue';
import Draggable from 'vuedraggable';
import OptionItem from '~/components/OptionItem.vue';
const props = defineProps<{ modelValue?: Array<{ text: string; color?: string; id?: string }> }>();
const emit = defineEmits<{ 'update:modelValue': (v: any) => void }>();

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
  const items: Array<{ id: string; text: string; color: string }> = (props.modelValue || []).map((o: any, i: number) => ({ id: o.id || `opt_${i}_${Date.now()}`, text: o.text || '', color: (o.color || '').trim() }));
  const used = new Set<string>();
  return items.map((it: { id: string; text: string; color: string }, idx: number) => {
    if (it.color) { used.add(it.color); return it; }
    const c = pickNextColor(used);
    used.add(c);
    return { ...it, color: c };
  });
})();
const options = reactive(initial as Opt[]);

const addOption = () => {
  const used = new Set<string>(options.map((o: Opt) => (o.color || '').toString()).filter(Boolean));
  const color = pickNextColor(used);
  options.push({ id: `opt_${options.length}_${Date.now()}`, text: '', color });
  emit('update:modelValue', toRaw(options));
};

const onUpdate = (opt: any) => {
  const idx = options.findIndex((o: Opt) => o.id === opt.id);
  if (idx >= 0) {
    // update properties in-place to preserve reactivity and avoid replacing the array element
    Object.assign(options[idx], opt);
    emit('update:modelValue', toRaw(options));
  }
};
const onRemove = (id: string) => { const idx = options.findIndex((o: Opt) => o.id === id); if (idx >= 0) { options.splice(idx, 1); emit('update:modelValue', toRaw(options)); } };
const emitUpdate = () => { emit('update:modelValue', toRaw(options)); };
</script>

<style scoped>
.option-list { display:block; }
</style>
