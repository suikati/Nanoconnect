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

// When loading existing modelValue, assign missing colors immediately so the editor shows them.
const initial: Opt[] = (props.modelValue || []).map((o: any, i: number) => ({
  id: o.id || `opt_${i}_${Date.now()}`,
  text: o.text || '',
  color: typeof o.color !== 'undefined' && o.color !== null && String(o.color).trim().length ? o.color : palette[i % palette.length]
}));
const options = reactive(initial as Opt[]);

const addOption = () => {
  const color = palette[options.length % palette.length];
  options.push({ id: `opt_${options.length}_${Date.now()}`, text: '', color });
  emit('update:modelValue', toRaw(options));
};

const onUpdate = (opt: any) => { const idx = options.findIndex((o: Opt) => o.id === opt.id); if (idx >= 0) { options[idx] = opt; emit('update:modelValue', toRaw(options)); } };
const onRemove = (id: string) => { const idx = options.findIndex((o: Opt) => o.id === id); if (idx >= 0) { options.splice(idx, 1); emit('update:modelValue', toRaw(options)); } };
const emitUpdate = () => { emit('update:modelValue', toRaw(options)); };
</script>

<style scoped>
.option-list { display:block; }
</style>
