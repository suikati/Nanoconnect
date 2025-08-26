<template>
  <div class="flex items-start gap-3 anim-fade-in">
    <div class="relative">
      <img
        src="/assets/images/nanosuke.png"
        alt="nanosuke"
        class="avatar"
        :class="[avatarAnimClass, clickAnim]"
        @click="onAvatarClick"
      />
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
import { defineProps, computed, ref, watch, onMounted } from 'vue';
const props = defineProps<{ text?: string; loading?: boolean; animationType?: 'auto' | 'bounce' | 'squish' | 'float' | 'none'; popOnUpdate?: boolean }>();
const text = computed(() => (props.text ?? ''));
const loading = computed(() => (props.loading ?? false));

const currentAnim = ref<string>('');
const basePool = ['bounce','float'];

function pickIdle() {
  if (props.animationType === 'auto') {
    return basePool[Math.floor(Math.random() * basePool.length)];
  }
  return props.animationType || 'bounce';
}

onMounted(() => {
  currentAnim.value = pickIdle();
});

watch(() => text.value, (n, o) => {
  if (!props.popOnUpdate) return;
  if (n && n !== o) {
    // play squish once
    currentAnim.value = 'squish';
    setTimeout(() => {
      // revert to idle
      const idle = pickIdle();
      // if idle equals squish, pick again to avoid constant pop
      currentAnim.value = idle === 'squish' ? 'bounce' : idle;
    }, 950);
  }
});

const avatarAnimClass = computed(() => {
  if (props.animationType === 'none') return '';
  const map: Record<string,string> = {
    bounce: 'nanosuke-anim-bounce',
    float: 'nanosuke-anim-float',
    squish: 'nanosuke-anim-squish'
  };
  return map[currentAnim.value] || '';
});

// Click (poyooon) handling
const clickAnim = ref<string>('');
function onAvatarClick() {
  // remove existing to retrigger
  clickAnim.value = '';
  requestAnimationFrame(() => {
    clickAnim.value = 'poyooon';
    // cleanup after animation end (~900ms)
    setTimeout(() => { if (clickAnim.value === 'poyooon') clickAnim.value = ''; }, 950);
  });
}
</script>

<style scoped>
.avatar { width:4rem; height:4rem; cursor:pointer; }
</style>
