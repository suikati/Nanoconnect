<template>
  <button
    :disabled="disabled"
    @click="onClick"
    :class="btnClass"
    :style="styleOverride"
    :data-selected="selected ? 'true' : 'false'"
    :aria-pressed="selected ? 'true' : 'false'"
  >
    <span class="font-medium truncate flex-1">{{ choice.text }}</span>
    <span class="text-[10px] sm:text-xs font-mono opacity-70 tabular-nums">{{ count }}</span>
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
  const base = 'group w-full text-left px-4 py-3 rounded-full box-border border flex items-center gap-3 justify-between focus-ring relative select-none transition-colors duration-150 bg-white/85 hover:bg-white';
  const selectedCls = props.selected
    ? 'border-primary-500 ring-2 ring-primary-300 bg-white shadow-sm'
    : 'border-primary-200 hover:border-primary-300 shadow-sm';
  const disabledCls = props.disabled
    ? (props.selected ? 'cursor-default' : 'cursor-not-allowed')
    : '';
  return [base, selectedCls, disabledCls].join(' ');
});

// If custom color provided, use it as a soft background (with slight translucency) without forcing white text.
const styleOverride = computed(() => {
  const anyChoice: any = props.choice;
  if (anyChoice && anyChoice.color) {
    return {
      backgroundColor: anyChoice.color + (anyChoice.color.endsWith(')') ? '' : ''),
    } as any;
  }
  return {} as any;
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
