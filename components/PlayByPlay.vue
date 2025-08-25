<template>
  <div class="flex items-start gap-3">
    <img src="/assets/images/linka.png" alt="linka" class="w-12 h-12 rounded-full" />
    <div class="bg-white border rounded-lg p-3 shadow-sm max-w-prose">
      <div v-if="loading" class="text-gray-400 text-sm">読み込み中…</div>
      <div v-else-if="text" class="text-sm text-gray-800 whitespace-pre-wrap">{{ text }}</div>
      <div v-else class="text-sm text-gray-500">実況はまだありません。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
const props = defineProps<{ text?: string; loading?: boolean }>();
const { text = '', loading = false } = props as any;
</script>

<style scoped>
.max-w-prose { max-width: 36rem; }
</style>
