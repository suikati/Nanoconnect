<template>
  <UiCard variant="glass" interactive padding="md">
    <template #header>
      <div class="flex items-center justify-between gap-3 w-full">
        <h2 class="text-primary-600 font-display font-bold text-sm sm:text-base">アンケート作成</h2>
        <span v-if="roomCode" class="text-[10px] sm:text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded-full font-mono tracking-wide">{{ roomCode }}</span>
      </div>
    </template>
    <div class="space-y-6">
      <!-- Slide sorter + global actions -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-[11px] sm:text-xs">
          <div class="flex items-center gap-2">
            <span class="text-gray-600">スライド一覧 / 並び替え</span>
            <span v-if="reorderDirty" class="text-rose-600 font-semibold">未保存</span>
          </div>
          <div class="flex items-center gap-2">
            <UiButton size="sm" variant="secondary" @pressed="$emit('add')">スライド追加</UiButton>
            <UiButton size="sm" variant="primary" :disabled="!roomCode || savingSlides || slides.length===0" @pressed="$emit('save')">
              <span v-if="!savingSlides">保存</span>
              <span v-else>保存中...</span>
            </UiButton>
          </div>
        </div>
        <SlideSorter
          :slides="slides"
          :current-slide-id="slides[currentIndex]?.id"
          @select="(i:number) => $emit('select', i)"
          @move="(p) => $emit('move', p)"
          @remove="(i:number) => $emit('remove', i)"
        />
        <slot />
      </div>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import UiButton from '~/components/ui/UiButton.vue';
import UiCard from '~/components/ui/UiCard.vue';
import SlideSorter from '~/components/SlideSorter.vue';

defineProps<{
  slides: Array<{ id: string; title: string; chartType?: 'bar' | 'pie'; choices: any[] }>;
  currentIndex: number;
  reorderDirty: boolean;
  roomCode: string;
  savingSlides: boolean;
}>();

defineEmits<{
  (e: 'add'): void;
  (e: 'save'): void;
  (e: 'select', index: number): void;
  (e: 'move', payload: { from: number; to: number }): void;
  (e: 'remove', index: number): void;
}>();
</script>
