<template>
  <div class="flex items-start gap-3 anim-fade-in">
    <div class="relative">
      <img src="/assets/images/nanosuke.png" alt="nanosuke" class="avatar" />
      <span class="status-dot" aria-hidden="true" />
    </div>
    <div class="comment-box bg-white/70 border border-secondary-200 rounded-xl px-3 py-2 shadow-sm backdrop-blur-sm max-w-[32rem]">
      <div v-if="loading" class="text-secondary-400 text-xs sm:text-sm">読み込み中…</div>
      <div v-else-if="text" class="text-gray-800 text-xs sm:text-sm whitespace-pre-wrap">{{ text }}</div>
      <div v-else class="text-gray-500 text-xs sm:text-sm">コメントはまだありません。</div>
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
.avatar { width: 2.5rem; height: 2.5rem; border-radius: 9999px; box-shadow: 0 0 0 3px rgba(255,255,255,.6); }
.status-dot { position:absolute; right:0; bottom:0; width:10px; height:10px; background:linear-gradient(90deg,#6366f1,#ec4899); border-radius:50%; box-shadow:0 0 0 2px #fff; }
</style>
