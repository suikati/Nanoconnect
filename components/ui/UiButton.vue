<template>
  <button
    :class="computedClass"
    class="inline-flex items-center justify-center font-semibold tracking-wide focus-ring select-none"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ variant?: 'primary'|'secondary'|'ghost'|'danger'|'pill'; size?: 'sm'|'md'; full?: boolean; disabled?: boolean }>();
const computedClass = computed(() => {
  const v = props.variant || 'primary';
  const size = props.size || 'md';
  const base = 'rounded-lg transition-all duration-200 shadow-sm active:scale-[.97]';
  const sizes: Record<string,string> = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm' };
  const map: Record<string,string> = {
    primary: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    secondary: 'bg-pink-500 hover:bg-pink-600 text-white',
    ghost: 'bg-white hover:bg-indigo-50 text-indigo-600 border border-indigo-200',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    pill: 'bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white rounded-full'
  };
  const disabled = props.disabled ? 'opacity-50 pointer-events-none' : '';
  const width = props.full ? 'w-full' : '';
  return [base, sizes[size], map[v], disabled, width].join(' ');
});
</script>
