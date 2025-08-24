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
const initial: Opt[] = (props.modelValue || []).map((o: any, i: number) => ({ id: o.id || `opt_${i}_${Date.now()}`, text: o.text || '', color: o.color || '#F3F4F6' }));
const options = reactive(initial as Opt[]);

const addOption = () => {
  options.push({ id: `opt_${options.length}_${Date.now()}`, text: '', color: '#F3F4F6' });
  emit('update:modelValue', toRaw(options));
};

const onUpdate = (opt: any) => { const idx = options.findIndex((o: Opt) => o.id === opt.id); if (idx >= 0) { options[idx] = opt; emit('update:modelValue', toRaw(options)); } };
const onRemove = (id: string) => { const idx = options.findIndex((o: Opt) => o.id === id); if (idx >= 0) { options.splice(idx, 1); emit('update:modelValue', toRaw(options)); } };
const emitUpdate = () => { emit('update:modelValue', toRaw(options)); };
</script>

<style scoped>
.option-list { display:block; }
</style>
