<template>
  <button
    :disabled="disabled"
    @click="onClick"
    :class="btnClass"
    :style="styleOverride"
    :data-selected="selected ? 'true' : 'false'"
    :aria-pressed="selected ? 'true' : 'false'"
    :aria-disabled="disabled ? 'true' : 'false'"
  >
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <!-- Check icon when selected -->
      <span v-if="selected" class="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 border border-white/40 shadow-sm">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.2" class="w-3.5 h-3.5 text-white">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 10.5 8 14l8-8" />
        </svg>
      </span>
      <span class="font-semibold truncate">{{ choice.text }}</span>
    </div>
    <span class="text-[10px] sm:text-xs font-mono opacity-90 tabular-nums tracking-wide">{{ count }}</span>
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
  const base = 'group w-full text-left px-4 py-3 rounded-full box-border border flex items-center gap-3 justify-between focus-ring relative select-none transition-all duration-150 font-medium text-white';

  // Base background (will be overridden by custom color if provided)
  let appearance = 'bg-primary-400 hover:brightness-105';

  if (props.selected) {
    appearance += ' ring-4 ring-primary-300/60 border-white/70 shadow-lg shadow-primary-500/25';
  } else {
    appearance += ' border-white/40 shadow-md';
  }

  // Disabled state: only slightly dim non-selected; keep selected vivid
  let disabledPart = '';
  if (props.disabled) {
    disabledPart = props.selected ? ' cursor-default' : ' opacity-85 brightness-95 cursor-not-allowed';
  } else {
    disabledPart = ' active:scale-[0.985] active:brightness-95';
  }

  return [base, appearance, disabledPart].join(' ');
});

// If custom color provided, use it as background and keep white text for contrast.
const styleOverride = computed(() => {
  const anyChoice: any = props.choice;
  if (anyChoice && anyChoice.color) {
    return {
  backgroundColor: anyChoice.color,
  color: '#fff'
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
