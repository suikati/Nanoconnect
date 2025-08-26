<template>
  <div v-if="slide" class="p-4 rounded-xl border bg-white/70 backdrop-blur-sm shadow-sm space-y-3">
    <div class="flex items-center justify-between text-xs sm:text-sm">
      <div class="text-gray-600 font-medium">Slide {{ displayIndex }} / {{ total }}</div>
    </div>
    <div class="flex items-center gap-2 mb-1">
      <input ref="titleInput" v-model="localTitle" @input="onTitle" placeholder="タイトル" class="flex-1 border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/60 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white/80" />
    </div>
    <div class="flex items-center gap-2 text-[10px] sm:text-xs" role="radiogroup" aria-label="グラフタイプ">
      <span class="sr-only">グラフタイプ</span>
      <button
        v-for="t in ['bar','pie']"
        :key="t"
        type="button"
        role="radio"
        :aria-checked="chartType === t"
        :tabindex="chartType === t ? 0 : -1"
        class="px-2 py-1 rounded-md border text-[10px] sm:text-xs font-medium transition focus:outline-none focus:ring-2 focus:ring-primary-400"
        :class="chartType === t ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white/70 hover:bg-primary-50 text-gray-600 border-primary-200'"
        @click="setType(t as any)"
        @keydown.enter.prevent="setType(t as any)"
        @keydown.space.prevent="setType(t as any)"
      >
        <span v-if="t==='bar'">棒</span>
        <span v-else>円</span>
      </button>
    </div>
    <OptionList :key="slide.id" v-model="localChoices" @update:modelValue="onChoices" />
    <div class="flex items-center gap-2 mt-2 justify-end">
      <UiButton size="sm" variant="ghost" @pressed="$emit('prev')" aria-label="prev" :disabled="displayIndex<=1">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
      </UiButton>
      <UiButton size="sm" variant="ghost" @pressed="$emit('next')" aria-label="next" :disabled="displayIndex>=total">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
      </UiButton>
    </div>
  </div>
  <div v-else class="text-xs sm:text-sm text-gray-500">スライドがありません。追加してください。</div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import OptionList from '~/components/OptionList.vue';
import UiButton from '~/components/ui/UiButton.vue';

const props = defineProps<{
  slide: { id: string; title: string; chartType?: 'bar' | 'pie'; choices: any[] } | null;
  index: number;
  total: number;
}>();

const emit = defineEmits<{
  (e: 'update:title', v: string): void;
  (e: 'update:choices', v: any[]): void;
  (e: 'update:chartType', v: 'bar' | 'pie'): void;
  (e: 'prev'): void;
  (e: 'next'): void;
  (e: 'dirty'): void;
}>();

const localTitle = ref('');
const localChoices = ref<any[]>([]);
const chartType = ref<'bar' | 'pie'>('bar');
const titleInput = ref<HTMLInputElement | null>(null);

watch(
  () => props.slide,
  (s) => {
    if (!s) return;
    localTitle.value = s.title || '';
    localChoices.value = [...(s.choices || [])];
    chartType.value = s.chartType || 'bar';
  },
  { immediate: true },
);

const onTitle = () => {
  emit('update:title', localTitle.value);
  emit('dirty');
};
const onChoices = (v: any[]) => {
  emit('update:choices', v);
  emit('dirty');
};
const setType = (t: 'bar' | 'pie') => {
  if (chartType.value === t) return;
  chartType.value = t;
  emit('update:chartType', t);
  emit('dirty');
};

const displayIndex = computed(() => props.index + 1);
</script>
