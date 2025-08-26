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
  const base = 'group w-full text-left px-4 py-3 rounded-xl border flex items-center gap-3 justify-between transition-all focus-ring relative overflow-hidden select-none';
  if (props.selected) {
    // 立体・押し込み (inset) スタイル
    const pressed = 'bg-white text-primary-700 border-primary-400 shadow-inner [box-shadow:inset_0_2px_4px_0_rgba(0,0,0,0.12),0_2px_4px_-1px_rgba(0,0,0,0.15)] translate-y-[1px]';
    return [base, pressed, props.disabled ? 'opacity-60 pointer-events-none' : ''].join(' ');
  }
  const normal = 'bg-white/80 backdrop-blur-sm border-primary-200 hover:bg-white hover:border-primary-300 text-gray-800 shadow-sm active:translate-y-[1px] active:shadow-inner active:border-primary-400';
  return [base, normal, props.disabled ? 'opacity-60 pointer-events-none' : ''].join(' ');
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
