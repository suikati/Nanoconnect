<template>
  <div class="option-list space-y-3">
    <OptionItem v-for="(opt, i) in options" :key="i" :option="opt" :index="i"
      @update="onUpdate" @remove="onRemove" @moveUp="onMoveUp" @moveDown="onMoveDown" />
    <div class="pt-2">
      <button class="w-full bg-gray-100 rounded-xl py-3 text-sm text-gray-700" @click.prevent="addOption">+ Add option</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import OptionItem from '~/components/OptionItem.vue';
const props = defineProps<{ modelValue: Array<{ text: string; color?: string }> }>();
const emit = defineEmits<{ 'update:modelValue': (v: any) => void }>();

const options = reactive(props.modelValue || [] as Array<any>);

const addOption = () => {
  options.push({ text: '', color: '#F3F4F6' });
  emit('update:modelValue', options);
};

const onUpdate = (opt: any, idx: number) => { options[idx] = opt; emit('update:modelValue', options); };
const onRemove = (idx: number) => { options.splice(idx, 1); emit('update:modelValue', options); };
const onMoveUp = (idx: number) => { if (idx <= 0) return; const a = options[idx-1]; options[idx-1] = options[idx]; options[idx] = a; emit('update:modelValue', options); };
const onMoveDown = (idx: number) => { if (idx >= options.length-1) return; const a = options[idx+1]; options[idx+1] = options[idx]; options[idx] = a; emit('update:modelValue', options); };
</script>

<style scoped>
.option-list { display:block; }
</style>
