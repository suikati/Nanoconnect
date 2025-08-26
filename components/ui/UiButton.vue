<template>
  <button
    type="button"
    :class="computedClass"
    class="inline-flex items-center justify-center font-semibold tracking-wide focus-ring select-none font-sans"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ref } from 'vue';
const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'pill' | 'outline' | 'play';
  size?: 'sm' | 'md' | 'lg';
  full?: boolean;
  disabled?: boolean;
}>();
const computedClass = computed(() => {
  const v = props.variant || 'primary';
  const size = props.size || 'md';
  const base = 'rounded-xl transition-all duration-200 shadow-sm active:scale-[.97] focus:outline-none';
  const sizes: Record<string, string> = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' };
  const map: Record<string, string> = {
    primary: 'bg-primary-500 hocus:bg-primary-600 text-white',
    secondary: 'bg-secondary-500 hocus:bg-secondary-600 text-white',
    ghost: 'bg-white hocus:bg-primary-50 text-primary-600 border border-primary-200',
    outline: 'bg-transparent border border-primary-400 text-primary-600 hocus:bg-primary-50',
    danger: 'bg-red-500 hocus:bg-red-600 text-white',
    play: 'bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-500 bg-[length:200%_auto] text-white animate-[none] hocus:animate-[pulse_3s_linear_infinite] shadow-pop',
    pill: 'bg-gradient-to-r from-primary-500 to-secondary-500 hocus:from-primary-600 hocus:to-secondary-600 text-white rounded-full shadow-pop',
  };
  const disabled = props.disabled ? 'opacity-50 pointer-events-none' : '';
  const width = props.full ? 'w-full' : '';
  return [base, sizes[size], map[v], disabled, width].join(' ');
});
const emit = defineEmits<{ (e: 'pressed', ev: Event): void; (e: 'click', ev: Event): void }>();
const locked = ref(false);
const handleClick = (e: Event) => {
  // prevent bubbling and accidental native form submits
  try {
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();
  } catch (err) {
    /* ignore */
  }
  if (props.disabled || locked.value) return;
  locked.value = true;
  emit('pressed', e);
  // short cooldown to avoid duplicate handling
  setTimeout(() => {
    locked.value = false;
  }, 300);
};
</script>
