<template>
  <button :disabled="disabled" @click="onClick" :class="btnClass" :style="btnStyle">
    <span class="font-medium">{{ choice.text }}</span>
    <span class="text-xs font-mono opacity-70">{{ count }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Choice } from '~/types/models';
const props = defineProps<{ choice: Choice; count: number; selected?: boolean; disabled?: boolean }>();
const btnClass = computed(() => {
  const base = 'w-full text-left px-4 py-3 rounded-xl border flex items-center justify-between transition-all focus-ring';
  const disabled = props.disabled ? 'opacity-60 pointer-events-none' : '';
  return [base, disabled, 'anim-pop'].join(' ');
});

const btnStyle = computed(() => {
  const defaultBg = props.selected ? '#4F46E5' : '#F8FAFC';
  const bg = (props.choice && (props.choice as any).color) ? (props.choice as any).color : defaultBg;
  const color = props.selected ? '#ffffff' : (props.choice && (props.choice as any).color ? '#ffffff' : '#0f172a');
  return { backgroundColor: bg, color };
});
const emit = defineEmits<{ vote: (choiceKey: string) => void }>();
let locked = false;
const onClick = (e: Event) => {
  try { e.stopImmediatePropagation(); e.preventDefault(); } catch (err) { /* ignore */ }
  if (locked || props.disabled) return;
  locked = true;
  emit('vote', props.choice.key);
  setTimeout(() => { locked = false; }, 300);
};
</script>
