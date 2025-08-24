<template>
  <button :disabled="disabled" @click="onClick" :class="btnClass">
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
  const active = props.selected ? 'bg-indigo-500 text-white border-indigo-500 shadow-pop' : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-100 text-indigo-700';
  const disabled = props.disabled ? 'opacity-60 pointer-events-none' : '';
  return [base, active, disabled, 'anim-pop'].join(' ');
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
