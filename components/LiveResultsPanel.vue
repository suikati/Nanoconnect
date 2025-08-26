<template>
  <div class="live-panel space-y-4">
    <div class="flex gap-4 items-start">
      <img src="/assets/images/linka.png" alt="linka" class="avatar" />
      <div class="flex-1 space-y-4 min-w-0">
        <!-- Summary -->
        <div class="summary flex flex-wrap items-center gap-3 text-[10px] sm:text-xs">
          <span class="px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 font-semibold tracking-wide">合計 {{ total }} 票</span>
          <template v-if="topPercents.length">
            <span v-for="t in topPercents" :key="t.key" class="inline-flex items-center gap-1 text-gray-600">
              <span class="w-2 h-2 rounded-full" :style="{ background: t.color || '#6366F1' }" />
              <span class="font-medium truncate max-w-[8rem]">{{ t.text }}</span>
              <span class="font-mono opacity-70">{{ t.pct }}%</span>
            </span>
          </template>
        </div>
        <!-- Chart -->
        <div class="chart-wrapper rounded-xl border border-primary-100 bg-white/90 backdrop-blur p-3 shadow-sm">
          <div class="h-[230px]">
            <VoteChart :counts="counts" :choices="choices" />
          </div>
        </div>
        <!-- Play text -->
        <div class="play-box rounded-xl border border-primary-100 bg-white/95 backdrop-blur p-3 shadow-sm">
          <div v-if="playLoading" class="text-primary-400 text-xs sm:text-sm">読み込み中…</div>
          <div v-else-if="playText" class="text-gray-800 text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{{ playText }}</div>
          <div v-else class="text-gray-500 text-xs sm:text-sm">実況はまだありません。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VoteChart from '~/components/VoteChart.vue';
import type { Choice } from '~/types/models';
const props = defineProps<{ counts: Record<string, number>; choices: Choice[]; playText?: string; playLoading?: boolean }>();

const counts = computed(() => props.counts || {});
const choices = computed(() => props.choices || []);
const playText = computed(() => props.playText || '');
const playLoading = computed(() => !!props.playLoading);

const total = computed(() => Object.values(counts.value).reduce((a: number, b: any) => a + (Number(b) || 0), 0));
const topPercents = computed(() => {
  const t = total.value || 0;
  if (!t) return [] as Array<{ key: string; text: string; pct: number; color?: string }>;
  const arr = choices.value.map((c: any) => {
    const v = counts.value[c.key] || 0;
    return { key: c.key, text: c.text, pct: Math.round((v / t) * 100), color: c.color };
  }).sort((a, b) => b.pct - a.pct).slice(0, 3);
  return arr;
});
</script>

<style scoped>
.avatar { width:4.5rem; height:4.5rem; border-radius:9999px; box-shadow:0 4px 14px -2px rgba(99,102,241,0.4),0 0 0 4px rgba(255,255,255,0.95); object-fit:contain; background:#fff; }
.chart-wrapper { position:relative; }
.play-box { position:relative; }
.summary { line-height:1.2; }
</style>
