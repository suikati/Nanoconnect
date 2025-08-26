<template>
  <button
    :disabled="disabled"
    @click="onClick"
    :class="btnClass"
    :style="styleOverride"
    :aria-pressed="selected ? 'true' : 'false'"
    :aria-disabled="disabled ? 'true' : 'false'"
  >
    <span class="font-medium truncate flex-1">{{ choice.text }}</span>
    <span class="text-[10px] sm:text-xs font-mono opacity-70 tabular-nums">{{ count }}</span>
    <!-- 選択済みバッジ -->
    <span v-if="selected" class="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-primary-600">
      <span class="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />確定
    </span>
    <!-- ロックオーバーレイ (非選択で無効時) -->
    <span v-if="disabled && !selected" class="absolute inset-0 rounded-xl bg-white/40 backdrop-blur-[1px] flex items-center justify-center text-gray-500 text-xs font-medium select-none">
      LOCKED
    </span>
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
  const base = 'group w-full text-left px-4 py-3 rounded-xl border flex items-center gap-3 justify-between transition-colors duration-150 focus-ring relative overflow-hidden select-none';
  const state: string[] = [];
  if (props.selected) {
    // シンプルな枠強調 + ほんの少し浮き (投票確定後は translate なし)
    state.push('bg-white border-2 border-primary-500 shadow-md');
  } else {
    state.push('bg-white/85 hover:bg-white border border-primary-200 hover:border-primary-300 text-gray-800 shadow-sm');
  }
  if (props.disabled) {
    // 無効: 選択済みは外観維持、非選択のみ cursor 変更
    state.push(props.selected ? 'cursor-default' : 'cursor-not-allowed');
  } else {
    // 押下時の一時的な沈み込み (投票前のみ)
    state.push('active:translate-y-[1px]');
  }
  return [base, ...state].join(' ');
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
