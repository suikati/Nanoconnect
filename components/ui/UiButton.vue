<template>
  <button
    type="button"
    :class="['inline-flex items-center justify-center select-none', computedClass, retroClass]"
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
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'pill';
  size?: 'sm' | 'md';
  full?: boolean;
  disabled?: boolean;
}>();
const computedClass = computed(() => {
  const v = props.variant || 'primary';
  const size = props.size || 'md';
  const base = 'rounded-md font-semibold tracking-wide focus-ring transition-all duration-200 active:scale-[.97]';
  const sizes: Record<string, string> = { sm: 'px-3 py-1.5 text-[11px]', md: 'px-4 py-2 text-sm' };
  const map: Record<string, string> = {
    primary: 'bg-indigo-500 hover:bg-indigo-600 text-white',
    secondary: 'bg-pink-500 hover:bg-pink-600 text-white',
    ghost: 'bg-white/90 hover:bg-white text-indigo-600 border border-indigo-200',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    pill: 'bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white rounded-full',
  };
  const disabled = props.disabled ? 'opacity-50 pointer-events-none' : '';
  const width = props.full ? 'w-full' : '';
  return [base, sizes[size], map[v], disabled, width].join(' ');
});

// retro 親クラスが付与されている場合に強制的にピクセルボタン化
const retroClass = computed(() => 'retro-btn');
// Emits 型: オブジェクトシグネチャではなく配列形式でも可だが、ここでは関数オーバーロードで厳密化
// 'pressed' と通常 click を区別
const emit = defineEmits<{
  (e: 'pressed', ev: Event): void;
  (e: 'click', ev: Event): void;
}>();
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
