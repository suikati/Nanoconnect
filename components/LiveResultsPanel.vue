<template>
  <div class="space-y-4">
    <div class="flex items-start gap-4">
      <div class="relative shrink-0">
        <img src="/assets/images/linka.png" alt="linka" class="avatar" />
      </div>
      <div class="flex-1 space-y-3">
        <div class="chart-wrapper rounded-xl border border-primary-100 bg-white/80 backdrop-blur-sm p-3 shadow-sm">
          <div class="h-[220px]">
            <VoteChart :counts="counts" :choices="choices" />
          </div>
        </div>
        <div class="play-box rounded-xl border border-primary-100 bg-white/85 backdrop-blur-sm p-3 shadow-sm">
          <div v-if="playLoading" class="text-primary-400 text-xs sm:text-sm">読み込み中…</div>
          <div v-else-if="playText" class="text-gray-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{{ playText }}</div>
          <div v-else class="text-gray-500 text-xs sm:text-sm">実況はまだありません。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import VoteChart from '~/components/VoteChart.vue';
import type { Choice } from '~/types/models';
const props = defineProps<{ counts: Record<string, number>; choices: Choice[]; playText?: string; playLoading?: boolean }>();
const counts = props.counts;
const choices = props.choices;
const playText = props.playText;
const playLoading = props.playLoading;
</script>

<style scoped>
.avatar { width:4.25rem; height:4.25rem; border-radius:9999px; box-shadow:0 4px 12px -2px rgba(99,102,241,0.35),0 0 0 4px rgba(255,255,255,0.9); object-fit:contain; }
.chart-wrapper { position:relative; }
.play-box { position:relative; }
</style>
