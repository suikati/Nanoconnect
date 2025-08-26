<template>
  <button :disabled="disabled" @click="onClick" :class="btnClass" :style="styleOverride" :aria-pressed="selected ? 'true' : 'false'">
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
  // disabled 状態の扱い (選択中は減光しない)
  const disabledClass = props.disabled
    ? (props.selected ? 'pointer-events-none cursor-default' : 'opacity-50 pointer-events-none cursor-not-allowed')
    : '';

  if (props.selected) {
    // 押し込み強調: 深い inset + y 方向 + わずかに縮小 + 上部ハイライト
    const pressed = [
      'bg-white text-primary-700 border-primary-500',
      'shadow-inner',
      '[box-shadow:inset_0_3px_6px_0_rgba(0,0,0,0.18),0_2px_3px_-1px_rgba(0,0,0,0.25)]',
      'translate-y-[2px] scale-[0.985]',
      'after:absolute after:inset-x-1 after:top-1 after:h-1 after:rounded after:bg-gradient-to-b after:from-white/70 after:to-transparent after:pointer-events-none'
    ].join(' ');
    return [base, pressed, disabledClass].join(' ');
  }
  const normal = 'bg-white/85 backdrop-blur-sm border-primary-200 hover:bg-white hover:border-primary-300 text-gray-800 shadow-sm active:translate-y-[2px] active:scale-[0.985] active:shadow-inner active:border-primary-400';
  return [base, normal, disabledClass].join(' ');
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
