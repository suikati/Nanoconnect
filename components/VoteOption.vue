<template>
  <button :disabled="disabled" @click="onClick" :class="btnClass" :style="styleOverride">
    <span class="font-medium truncate">{{ choice.text }}</span>
    <span class="text-[10px] sm:text-xs font-mono opacity-70">{{ count }}</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Choice } from '~/types/models';
const props = defineProps<{
  choice: Choice;
  count: number;
  selected?: boolean;
  disabled?: boolean;
}>();
const btnClass = computed(() => {
  const base = 'group w-full text-left px-4 py-3 rounded-xl border flex items-center gap-3 justify-between transition-all focus-ring anim-pop relative overflow-hidden';
  const palette = props.selected
    ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-transparent shadow-pop'
    : 'bg-surface-alt hover:bg-white border-primary-100 hover:border-primary-300 text-gray-800';
  const disabled = props.disabled ? 'opacity-60 pointer-events-none' : '';
  return [base, palette, disabled].join(' ');
});

// Fallback inline style only if custom color provided in choice
const styleOverride = computed(() => {
  const anyChoice: any = props.choice;
  if (anyChoice && anyChoice.color) {
    return {
      backgroundColor: anyChoice.color,
      color: '#ffffff'
    };
  }
  return {};
});
const emit = defineEmits<{ (e: 'vote', choiceKey: string): void }>();
let locked = false;
const onClick = (e: Event) => {
  try {
    e.stopImmediatePropagation();
    e.preventDefault();
  } catch (err) {
    /* ignore */
  }
  if (locked || props.disabled) return;
  locked = true;
  emit('vote', props.choice.key);
  setTimeout(() => {
    locked = false;
  }, 300);
};
</script>
