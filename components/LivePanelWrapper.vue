<template>
  <UiCard v-if="choices.length" variant="glass" padding="md" interactive>
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="text-primary-600 font-display font-bold text-sm sm:text-base">Live</span>
        <UiButton size="sm" variant="secondary" @pressed="$emit('refresh')">実況更新</UiButton>
      </div>
    </template>
    <LiveResultsPanel :counts="counts" :choices="choices" :play-text="playText" :play-loading="playLoading" :chart-type="chartType" />
  </UiCard>
</template>
<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue';
import UiButton from '~/components/ui/UiButton.vue';
import LiveResultsPanel from '~/components/LiveResultsPanel.vue';
import type { Choice } from '~/types/models';

defineProps<{
  counts: Record<string, number>;
  choices: Choice[];
  playText: string;
  playLoading: boolean;
  chartType: 'bar' | 'pie';
}>();
defineEmits<{ (e: 'refresh'): void }>();
</script>
