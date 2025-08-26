<template>
  <AppShell>
  <div class="max-w-6xl mx-auto grid xl:grid-cols-5 gap-8">
      <!-- Left: Compact slide editor + control -->
      <div class="xl:col-span-3 space-y-6">
        <UiCard variant="glass" interactive padding="md">
          <template #header>
            <div class="flex items-center justify-between gap-3 w-full">
              <h2 class="text-primary-600 font-display font-bold text-sm sm:text-base">アンケート作成</h2>
              <span v-if="roomCode" class="text-[10px] sm:text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded-full font-mono tracking-wide">{{ roomCode }}</span>
            </div>
          </template>

          <!-- Compact editor: show current slide only -->
          <div class="space-y-6">
            <!-- Slide sorter + global actions -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-[11px] sm:text-xs">
                <div class="flex items-center gap-2">
                  <span class="text-gray-600">スライド一覧 / 並び替え</span>
                  <span v-if="reorderDirty" class="text-rose-600 font-semibold">未保存</span>
                </div>
                <div class="flex items-center gap-2">
                  <UiButton size="sm" variant="secondary" @pressed="addSlide">スライド追加</UiButton>
                  <UiButton size="sm" variant="primary" :disabled="!roomCode || savingSlides || slides.length===0" @pressed="onSaveSlides">
                    <span v-if="!savingSlides">保存</span>
                    <span v-else>保存中...</span>
                  </UiButton>
                </div>
              </div>
              <SlideSorter
                :slides="slides"
                :current-slide-id="slides[currentIndex]?.id"
                @select="(i:number) => setIdx(i)"
                @move="onMoveSlide"
                @remove="removeSlide"
              />
            </div>
            <!-- Current slide editor -->
            <div class="space-y-3">
            <div class="flex items-center justify-between text-xs sm:text-sm">
              <div class="text-gray-600 font-medium">Slide {{ (currentIndex || 0) + 1 }} / {{ slides.length }}</div>
              <div class="flex items-center gap-2">
                <!-- placeholder to keep header aligned -->
              </div>
            </div>

            <div v-if="slides && slides[currentIndex]" class="p-4 rounded-xl border bg-white/70 backdrop-blur-sm shadow-sm space-y-3">
              <div class="flex items-center gap-2 mb-1">
                <input ref="titleInput" v-model="slides[currentIndex].title" @input="reorderDirty = true" placeholder="タイトル" class="flex-1 border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/60 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white/80" />
              </div>
              <!-- Chart type toggle -->
              <div class="flex items-center gap-2 text-[10px] sm:text-xs">
                <span class="text-gray-500">グラフタイプ:</span>
                <button
                  v-for="t in ['bar','pie']"
                  :key="t"
                  type="button"
                  class="px-2 py-1 rounded-md border text-[10px] sm:text-xs font-medium transition"
                  :class="slides[currentIndex].chartType === t || (!slides[currentIndex].chartType && t==='bar') ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white/70 hover:bg-primary-50 text-gray-600 border-primary-200'"
                  @click="setChartType(t as any)"
                >
                  <span v-if="t==='bar'">棒</span>
                  <span v-else>円</span>
                </button>
              </div>
              <OptionList :key="slides[currentIndex].id" v-model="slides[currentIndex].choices" @update:modelValue="onChoicesUpdate" />
            </div>
            <div v-else class="text-xs sm:text-sm text-gray-500">スライドがありません。追加してください。</div>

            <div class="flex items-center gap-2 mt-2 justify-end">
              <UiButton size="sm" variant="ghost" @pressed="prevSlide" aria-label="prev" :disabled="currentIndex<=0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </UiButton>
              <UiButton size="sm" variant="ghost" @pressed="nextSlide" aria-label="next" :disabled="currentIndex>=slides.length-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </UiButton>
            </div>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Right: Unified Live panel & Comments -->
      <div class="xl:col-span-2 space-y-6">
        <UiCard v-if="currentSlideChoices.length" variant="glass" padding="md" interactive>
          <template #header>
            <div class="flex items-center justify-between w-full">
              <span class="text-primary-600 font-display font-bold text-sm sm:text-base">Live</span>
              <UiButton size="sm" variant="secondary" @pressed="fetchPlay">実況更新</UiButton>
            </div>
          </template>
          <LiveResultsPanel :counts="aggregates?.counts || {}" :choices="currentSlideChoices" :play-text="playText" :play-loading="playLoading" :chart-type="activeChartType" />
        </UiCard>
        <UiCard v-if="roomCode" title="Comments" titleClass="text-secondary-600 font-display" variant="glass" padding="md">
          <div class="mb-3 text-[10px] sm:text-xs text-gray-500">実況は上部 Live パネルに表示</div>
          <ul class="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            <CommentItem
              v-for="c in comments"
              :key="c.id"
              :comment="c"
              :currentAnonId="myAnonId"
              @like="() => onLikeComment(c.id)"
              @delete="() => onDeleteComment(c.id)"
            />
          </ul>
        </UiCard>
        <pre v-if="isDev" class="text-[10px] text-gray-400 whitespace-pre-wrap">{{ log }}</pre>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch, onUnmounted, nextTick } from 'vue';
import useRoom from '~/composables/useRoom';
import VoteChart from '~/components/VoteChart.vue';
import createDbListener from '~/composables/useDbListener';
import AppShell from '~/components/ui/AppShell.vue';
import UiButton from '~/components/ui/UiButton.vue';
import UiCard from '~/components/ui/UiCard.vue';
import CommentItem from '~/components/CommentItem.vue';
import OptionList from '~/components/OptionList.vue';
import LiveResultsPanel from '~/components/LiveResultsPanel.vue';
import SlideSorter from '~/components/SlideSorter.vue';
import type { Aggregate, Comment as CommentType, Choice, Slide } from '~/types/models';

type RoomApi = {
  createRoom?: () => Promise<string>;
  saveSlides?: (code: string, slides: any[]) => Promise<void>;
  setSlideIndex?: (code: string, idx: number) => Promise<void>;
  getAnonId?: () => string | null;
  likeComment?: (code: string, commentId: string) => Promise<void>;
  deleteComment?: (code: string, commentId: string) => Promise<void>;
};
type UIComment = CommentType & { id: string };

let r: RoomApi | null = null;
const roomCode = ref('');
const currentIndex = ref(0);
const log = ref('');

// TODO: 開発が終わったらplaceholderに変更
const palette = ['#4F46E5', '#EC4899', '#F97316', '#10B981', '#06B6D4', '#F59E0B'];
const slides = reactive<
  Array<{ id: string; title: string; chartType?: 'bar' | 'pie'; choices: Array<{ id?: string; text: string; color?: string }> }>
>([
  {
    id: `slide_0_${Date.now()}`,
    title: '好きな色は？',
    choices: [
      { id: `opt_0_${Date.now()}`, text: '赤', color: '#EF4444' },
      { id: `opt_1_${Date.now()}`, text: '青', color: '#3B82F6' },
      { id: `opt_2_${Date.now()}`, text: '緑', color: '#10B981' },
    ],
  },
]);
const aggregates = ref<Aggregate | null>(null);
const currentSlideChoices = ref<Choice[]>([]);
const comments = ref<UIComment[]>([]);
let unsubComments: (() => void) | null = null;
const myAnonId = ref<string | null>(null);
const isDev = false; // simplified: devログ非表示
const playText = ref('');
const playLoading = ref(false);
const titleInput = ref<HTMLInputElement | null>(null);
const reorderDirty = ref(false);
const suppressSlideSync = ref(false);
const savingSlides = ref(false);

async function fetchPlay() {
  if (!roomCode.value) return;
  playLoading.value = true;
  try {
    const resp = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: slides[currentIndex.value]?.title || '', choices: currentSlideChoices.value }),
    });
    const data = await resp.json();
    playText.value = data?.text || '(生成失敗)';
  } catch (e: any) {
    playText.value = '(エラー)';
  } finally {
    playLoading.value = false;
  }
}

// リスナーのクリーンアップ用ハンドル
let unsubSlideIndex: (() => void) | null = null;
let unsubAggregates: (() => void) | null = null;
let unsubSlideContent: (() => void) | null = null;

const ensureR = () => {
  if (!r) r = useRoom();
  return r;
};

const addSlide = () => {
  console.debug('presenter: addSlide called');
  const idx = slides.length % palette.length;
  slides.push({
    id: `slide_${slides.length}_${Date.now()}`,
    title: '',
    choices: [{ id: `opt_0_${Date.now()}`, text: '', color: palette[idx] }],
  });
  currentIndex.value = slides.length - 1;
  nextTick(() => { try { titleInput.value?.focus(); } catch (e) {} });
  reorderDirty.value = true;
};
const removeSlide = (i: number) => {
  console.debug('presenter: removeSlide', i);
  slides.splice(i, 1);
  // if currentIndex is out of bounds after removal, clamp it
  if (currentIndex.value >= slides.length) {
    currentIndex.value = Math.max(0, slides.length - 1);
  }
  reorderDirty.value = true;
};

const onMoveSlide = ({ from, to }: { from: number; to: number }) => {
  if (to < 0 || to >= slides.length || from === to) return;
  suppressSlideSync.value = true;
  const keepId = slides[currentIndex.value]?.id;
  const item = slides.splice(from, 1)[0];
  slides.splice(to, 0, item);
  const newIdx = slides.findIndex((s) => s.id === keepId);
  if (newIdx >= 0) currentIndex.value = newIdx;
  reorderDirty.value = true;
  // しばらくしたら同期再開（リスナーからの上書きを抑制）
  setTimeout(() => (suppressSlideSync.value = false), 250);
};

// ルーム作成/入室 UI は index.vue へ移動。presenter は code クエリで自動参加。

const onSaveSlides = async () => {
  console.debug('presenter: onSaveSlides called');
  if (!roomCode.value) {
    log.value = 'no room';
    return;
  }
  savingSlides.value = true;

  // UI validation: each slide must have at least 2 non-empty choices
  const palette = ['#4F46E5', '#EC4899', '#F97316', '#10B981', '#06B6D4', '#F59E0B'];
  for (const s of slides) {
    const nonEmpty = (s.choices || []).filter((c: any) => c && String(c.text).trim().length > 0);
    if (nonEmpty.length < 2) {
      // user-visible validation
      window.alert(`スライド "${s.title || '無題'}" は最低2つの選択肢が必要です。`);
      savingSlides.value = false;
      return;
    }
  }

  // Normalize slides and auto-assign colors when missing
  const payload = slides.map((s: { title: string; chartType?: 'bar' | 'pie'; choices: any[] }, si: number) => {
    const choices = (s.choices || []).map((c: any, ci: number) => {
      const rawColor = c && c.color ? String(c.color) : '';
      const placeholder = '#f3f4f6';
      const normalizedColor =
        rawColor && rawColor.toLowerCase() !== placeholder
          ? rawColor
          : palette[(ci + si) % palette.length];
      return {
        text: String(c.text || '').trim(),
        color: normalizedColor,
      };
    });
    return { title: s.title || 'untitled', chartType: s.chartType, choices };
  });

  try {
    ensureR();
    const keepId = slides[currentIndex.value]?.id;
    await (r as any).saveSlides(roomCode.value, payload);
    // current スライドの新しい index を再計算し共有 slideIndex を更新
    if (keepId) {
      const idx = slides.findIndex((s) => s.id === keepId);
      if (idx >= 0) {
        await (r as any).setSlideIndex(roomCode.value, idx);
        currentIndex.value = idx;
      }
    }
    log.value = 'saved slides';
    reorderDirty.value = false;
  } catch (e: any) {
    log.value = `save error: ${e.message}`;
  } finally {
    savingSlides.value = false;
  }
};

const setIdx = async (idx: number) => {
  // clamp requested index into valid range
  const len = slides.length;
  const clamped = len > 0 ? Math.max(0, Math.min(idx, len - 1)) : 0;

  // If no room is active yet, just update local index
  if (!roomCode.value) {
    currentIndex.value = clamped;
    return;
  }

  try {
    ensureR();
    await (r as any).setSlideIndex(roomCode.value, clamped);
    currentIndex.value = clamped;
  } catch (e: any) {
    log.value = `set index error: ${e.message}`;
  }
};

onMounted(() => {
  ensureR();
  try {
    myAnonId.value = (r as any).getAnonId();
  } catch (e) {
    myAnonId.value = null;
  }
  // クエリパラメータからルームコードを取得し自動参加
  try {
    const nuxt = useNuxtApp();
    const qCode = (nuxt.$router.currentRoute.value.query.code as string) || '';
    if (qCode) roomCode.value = qCode;
  } catch (e) { /* ignore */ }
  // ルームがあるときに集計を監視する
  // （後で presenter 用にも index/audience と同様のリスナーを追加可能）
});

// audience と似たロジックを再利用：roomCode が設定されたら slideIndex とスライドを購読する
watch(roomCode, async (val: string | null) => {
  // 以前のリスナーをクリーンアップ
  try {
    ensureR();
  } catch (e) {
    // なし（エラーハンドリング）
  }
  if (!val) return;

  const nuxt = useNuxtApp();
  const db = (nuxt.$firebaseDb as any) || null;
  if (!db) return;

  // slideIndex のリスナー（前のリスナーをクリーンアップ）
  if (unsubSlideIndex) {
    unsubSlideIndex();
    unsubSlideIndex = null;
  }
  unsubSlideIndex = createDbListener(db, `rooms/${val}/slideIndex`, (snap: any) => {
    if (!snap) return;
    const idx = snap.val();
    currentIndex.value = typeof idx === 'number' ? idx : 0;

    // スライド内容のリスナー
    if (unsubSlideContent) {
      try {
        unsubSlideContent();
      } catch (e) {
        /* ignore */
      }
      unsubSlideContent = null;
    }
    unsubSlideContent = createDbListener(
      db,
      `rooms/${val}/slides/slide_${(currentIndex.value || 0) + 1}`,
      (s: any) => {
    if (suppressSlideSync.value) return; // 並び替え直後の一時抑制
        const slideObj = s && s.val ? (s.val() as Slide) : null;
        if (slideObj && slideObj.choices) {
          currentSlideChoices.value = Object.entries(slideObj.choices).map(([k, v]) => {
            const item = v as { text: string; color?: string };
            return { key: k, text: item.text, color: item.color };
          });
        } else {
          currentSlideChoices.value = [];
        }

        // Also reflect DB values into the editor model (`slides`) so color pickers show saved colors
        try {
          const slideObj2 = slideObj;
          if (slideObj2) {
            const idx = currentIndex.value || 0;
            const editorChoices = slideObj2.choices
              ? Object.entries(slideObj2.choices).map(([k, v]) => ({
                  id: k,
                  text: (v as any).text || '',
                  color: (v as any).color,
                }))
              : [];
            while (slides.length <= idx)
              slides.push({
                id: `slide_${slides.length}_${Date.now()}`,
                title: '',
                choices: [{ text: '', color: '#F3F4F6' }],
              });
            // preserve existing slide id when updating
            const existingId = slides[idx].id || `slide_${idx}_${Date.now()}`;
            slides[idx] = {
              id: existingId,
              title: slideObj2.title || '',
              chartType: (slideObj2 as any).chartType || 'bar',
              choices: editorChoices,
            } as any;
          }
        } catch (e) {
          /* ignore */
        }
      },
    );

    // 集計（aggregates）のリスナー
    if (unsubAggregates) {
      try {
        (unsubAggregates as any)();
      } catch (e) {
        /* ignore */
      }
      unsubAggregates = null;
    }
    unsubAggregates = createDbListener(
      db,
      `rooms/${val}/aggregates/slide_${(currentIndex.value || 0) + 1}`,
      (snap: any) => {
        const a = snap && snap.val ? snap.val() : null;
        aggregates.value = a || { counts: {}, total: 0 };
      },
    );

    // コメント一覧のリスナー
    if (unsubComments) {
      try {
        (unsubComments as any)();
      } catch (e) {
        /* ignore */
      }
      unsubComments = null;
    }
    unsubComments = createDbListener(db, `rooms/${val}/comments`, (snap: any) => {
      const arr: UIComment[] = [];
      snap.forEach((child: any) => {
        arr.unshift({ id: child.key as string, ...(child.val() as CommentType) });
      });
      comments.value = arr;
    });
  });
});

// コンポーネント単位で一度だけクリーンアップを登録
onUnmounted(() => {
  try {
    if (unsubSlideIndex) (unsubSlideIndex as any)();
  } catch (e) {
    /* ignore */
  }
  try {
    if (unsubSlideContent) (unsubSlideContent as any)();
  } catch (e) {
    /* ignore */
  }
  try {
    if (unsubAggregates) (unsubAggregates as any)();
  } catch (e) {
    /* ignore */
  }
  try {
    if (unsubComments) (unsubComments as any)();
  } catch (e) {
    /* ignore */
  }
});

const prevSlide = () => {
  setIdx(Math.max(0, currentIndex.value - 1));
};
const nextSlide = () => {
  setIdx(currentIndex.value + 1);
};

// Defensive: if currentIndex points outside slides (e.g., slides were removed), clamp it
watch(
  () => slides.length,
  (len) => {
    if (currentIndex.value >= len) {
      currentIndex.value = Math.max(0, len - 1);
    }
  },
);

const onLikeComment = async (commentId: string) => {
  if (!roomCode.value) return;
  try {
    ensureR();
    await (r as any).likeComment(roomCode.value, commentId);
  } catch (e: any) {
    log.value = `like error: ${e.message}`;
  }
};

const onDeleteComment = async (commentId: string) => {
  if (!roomCode.value) return;
  try {
    ensureR();
    await (r as any).deleteComment(roomCode.value, commentId);
  } catch (e: any) {
    log.value = `delete error: ${e.message}`;
  }
};

function onChoicesUpdate() {
  // 選択肢編集も未保存フラグに反映
  reorderDirty.value = true;
}

const activeChartType = computed(() => {
  const s = slides[currentIndex.value];
  return (s && s.chartType) || 'bar';
});

function setChartType(t: 'bar' | 'pie') {
  const s = slides[currentIndex.value];
  if (!s) return;
  if (s.chartType === t) return;
  s.chartType = t;
  reorderDirty.value = true;
}
</script>
