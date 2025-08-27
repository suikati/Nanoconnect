<template>
  <div class="flex items-start gap-3 anim-fade-in">
    <div class="relative">
  <img
        src="/assets/images/nanosuke.png"
        alt="nanosuke"
        class="avatar"
        :class="[avatarAnimClass, clickAnim, enterAnim]"
        @click="onAvatarClick"
      />
      <span class="status-dot" aria-hidden="true" />
    </div>
    <div class="comment-box bg-white/70 border border-secondary-200 rounded-xl px-3 py-2 shadow-sm backdrop-blur-sm max-w-[32rem]">
      <div v-if="loading" class="text-secondary-400 text-xs sm:text-sm">読み込み中…</div>
      <div v-else-if="text" class="text-gray-800 text-xs sm:text-sm whitespace-pre-wrap">{{ text }}</div>
      <div v-else class="text-gray-500 text-xs sm:text-sm">説明会に参加してくれてありがとうナノ！</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
const props = defineProps<{ text?: string; loading?: boolean; animationType?: 'auto' | 'bounce' | 'squish' | 'float' | 'none'; popOnUpdate?: boolean }>();
const text = computed(() => (props.text ?? ''));
const loading = computed(() => (props.loading ?? false));

const currentAnim = ref<string>('');
const enterAnim = ref<string>('purupuru');
const basePool = ['bounce','float']; // 自動モードのアイドル候補

function pickIdle() {
  if (props.animationType === 'auto') {
    return basePool[Math.floor(Math.random() * basePool.length)];
  }
  return props.animationType || 'bounce';
}

onMounted(() => {
  // 初回: 入場アニメ完了後にアイドルアニメ開始
  setTimeout(() => {
    enterAnim.value = '';
    currentAnim.value = pickIdle();
  }, 820); // slightly longer than purupuru duration
});

watch(() => text.value, (n, o) => {
  if (!props.popOnUpdate) return;
  if (n && n !== o) {
  // 更新時: 一度だけ squish アニメ再生
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

// クリック時アニメ (purupuru / poyooon ランダム)
const clickAnim = ref<string>('');
const clickVariants: Array<{ name: string; dur: number }> = [
  { name: 'poyooon', dur: 900 },
  { name: 'purupuru', dur: 800 },
];
function onAvatarClick() {
  // 初期 purupuru 中は重複回避のため除外
  const pool = enterAnim.value === 'purupuru' ? clickVariants.filter(v => v.name !== 'purupuru') : clickVariants;
  const picked = pool[Math.floor(Math.random() * pool.length)];
  // reset to retrigger even if same class
  const prev = clickAnim.value;
  clickAnim.value = '';
  // Force next frame
  requestAnimationFrame(() => {
    clickAnim.value = picked.name;
    const timeout = picked.dur + 50; // small buffer to ensure animationend
    setTimeout(() => { if (clickAnim.value === picked.name) clickAnim.value = ''; }, timeout);
  });
}
</script>

<style scoped>
.avatar { width:4rem; height:4rem; cursor:pointer; }
</style>
