<template>
  <div class="bg-white rounded-2xl shadow-md p-5 border border-gray-100 relative overflow-hidden anim-fade-in">
    <div v-if="title || $slots.header" class="mb-3 flex items-center justify-between">
      <h3 v-if="title" class="font-semibold text-gray-700" :class="titleClass">{{ title }}</h3>
      <slot name="header" />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps<{ title?: string; titleClass?: string }>();
</script>
