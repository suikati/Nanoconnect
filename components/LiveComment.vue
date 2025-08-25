<template>
  <div class="flex items-start gap-3">
    <img src="/assets/images/nanosuke.png" alt="nanosuke" class="w-10 h-10 rounded-full" />
    <div class="bg-pink-50 border border-pink-100 rounded-lg p-2 shadow-sm">
      <div v-if="loading" class="text-gray-400 text-sm">読み込み中…</div>
      <div v-else-if="text" class="text-sm text-gray-800">{{ text }}</div>
      <div v-else class="text-sm text-gray-500">コメントはまだありません。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';
const props = defineProps<{ text?: string; loading?: boolean }>();
const text = computed(() => (props.text ?? ''));
const loading = computed(() => (props.loading ?? false));
</script>

<style scoped>
.w-10 { width: 2.5rem; }
.h-10 { height: 2.5rem; }
</style>
