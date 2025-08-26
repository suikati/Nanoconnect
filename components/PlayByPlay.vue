<template>
  <div class="flex items-start gap-3 anim-fade-in">
    <img src="/assets/images/linka.png" alt="linka" class="avatar" />
    <div class="glass-box bg-white/70 border border-primary-100 rounded-xl p-3 shadow-sm backdrop-blur-sm max-w-prose">
      <div v-if="loading" class="text-primary-400 text-xs sm:text-sm">読み込み中…</div>
      <div v-else-if="text" class="text-gray-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{{ text }}</div>
      <div v-else class="text-gray-500 text-xs sm:text-sm">実況はまだありません。</div>
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
.max-w-prose { max-width: 36rem; }
.avatar { width:3rem; height:3rem; border-radius:9999px; box-shadow:0 0 0 3px rgba(255,255,255,.6); }
</style>
