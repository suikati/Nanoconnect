<template>
  <section :class="wrapperClass">
    <div v-if="title || $slots.header" class="mb-4 flex items-center justify-between gap-4">
      <h3 v-if="title" :class="['font-semibold tracking-tight text-sm sm:text-base', titleClass]">{{ title }}</h3>
      <slot name="header" />
    </div>
    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  title?: string;
  titleClass?: string;
  padding?: 'sm' | 'md' | 'lg' | 'none';
  variant?: 'solid' | 'glass' | 'subtle';
  interactive?: boolean;
}>();

const wrapperClass = computed(() => {
  const pad = props.padding || 'md';
  const variant = props.variant || 'glass';
  const base = 'relative overflow-hidden rounded-2xl border anim-fade-in text-ink-soft';
  const pads: Record<string, string> = { none: 'p-0', sm: 'p-3', md: 'p-5', lg: 'p-7' };
  const variants: Record<string, string> = {
  glass: 'glass bg-white/70 border-white/60 shadow-md backdrop-blur before:absolute before:inset-0 before:bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.15)_85%)] before:pointer-events-none',
    solid: 'bg-white border-primary-100 shadow-md',
    subtle: 'bg-surface-alt border-surface-alt shadow-sm'
  };
  const interactive = props.interactive ? 'transition hocus:shadow-pop hocus:-translate-y-0.5' : '';
  return [base, pads[pad], variants[variant], interactive].join(' ');
});
</script>
