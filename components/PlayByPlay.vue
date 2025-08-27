<template>
  <div class="flex items-start gap-3 anim-fade-in">
    <div class="relative">
      <img src="/assets/images/linka.png" alt="linka" class="avatar" />
    </div>
  <div class="play-box bg-white/90 border border-primary-100 rounded-xl px-3 py-2 shadow-sm backdrop-blur-sm max-w-[36rem]">
  <div v-if="loading" class="text-primary-400 text-xs sm:text-sm">読み込み中…</div>
      <div v-else-if="text" class="text-gray-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{{ text }}</div>
      <div v-else class="text-gray-500 text-xs sm:text-sm">実況はまだありません。</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{ text?: string; loading?: boolean }>();
const text = computed(() => props.text || '');
const loading = computed(() => !!props.loading);
</script>

<style scoped>
.avatar { width:3rem; height:3rem; border-radius:9999px; box-shadow:0 4px 14px -2px rgba(99,102,241,0.25); object-fit:contain; background:#fff; }
.play-box { position:relative; }
</style>
