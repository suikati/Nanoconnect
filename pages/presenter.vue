<template>
  <AppShell>
    <div class="max-w-6xl mx-auto grid xl:grid-cols-5 gap-8">
      <!-- Left: Compact slide editor + control -->
      <div class="xl:col-span-3 space-y-6">
        <UiCard>
          <template #header>
            <div class="flex items-center gap-3">
              <!-- <span class="text-indigo-600 font-extrabold">発表者</span> -->
              <UiButton size="sm" variant="primary" @pressed="onCreateRoom">ルームを作る</UiButton>
              <div class="flex items-center gap-2">
                <input v-model="joinCodeInput" placeholder="またはルームコードを入力" class="border rounded px-2 py-1 text-sm" />
                <UiButton size="sm" variant="ghost" @pressed="onEnterRoom">入室</UiButton>
              </div>
              <span
                v-if="roomCode"
                class="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full"
                >ルームコード: {{ roomCode }}</span
              >
            </div>
          </template>

          <!-- Compact editor: show current slide only -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-600">Slide {{ (currentIndex || 0) + 1 }} / {{ slides.length }}</div>
              <div class="flex items-center gap-2">
                <!-- placeholder to keep header aligned -->
              </div>
            </div>

            <div v-if="slides && slides[currentIndex]" class="p-3 rounded-lg border bg-gray-50">
              <div class="flex items-center gap-2 mb-2">
                <input v-model="slides[currentIndex].title" placeholder="Title" class="flex-1 border rounded-lg px-3 py-2 focus-ring text-sm" />
                <UiButton size="sm" variant="ghost" @pressed="removeSlide(currentIndex)">削除</UiButton>
              </div>
              <OptionList v-model="slides[currentIndex].choices" />
            </div>
            <div v-else class="text-sm text-gray-500">スライドがありません。追加してください。</div>

            <div class="flex items-center gap-3 mt-2">
              <UiButton variant="secondary" size="sm" @pressed="addSlide">アンケートを追加</UiButton>
              <UiButton variant="primary" size="sm" @pressed="onSaveSlides" :disabled="!roomCode">保存</UiButton>
              <div class="text-xs text-gray-500">Prev/Nextで切替ができます。</div>
            </div>
            <div class="flex justify-end mt-3">
              <div class="flex items-center gap-2">
                <UiButton size="sm" variant="ghost" @pressed="prevSlide">Prev</UiButton>
                <UiButton size="sm" variant="ghost" @pressed="nextSlide">Next</UiButton>
              </div>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Right: Live Result & Comments -->
      <div class="xl:col-span-2 space-y-6">
        <UiCard
          v-if="aggregates && currentSlideChoices.length"
          title="Live Results"
          titleClass="text-indigo-700"
        >
          <VoteChart :counts="aggregates.counts" :choices="currentSlideChoices" />
        </UiCard>
        <UiCard v-if="roomCode" title="Comments" titleClass="text-pink-600">
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm text-gray-600">実況プレビュー</div>
            <div class="flex items-center gap-2">
              <UiButton size="sm" variant="secondary" @pressed="fetchPlay">実況更新</UiButton>
            </div>
          </div>
          <PlayByPlay :text="playText" :loading="playLoading" />
          <div class="my-3 border-t pt-3"></div>

          <!-- Comment generation UI removed for presenter view -->

          <ul class="space-y-3 max-h-[460px] overflow-y-auto pr-1 mt-3">
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
import { reactive, ref, onMounted, watch, onUnmounted } from 'vue';
import useRoom from '~/composables/useRoom';
import VoteChart from '~/components/VoteChart.vue';
import createDbListener from '~/composables/useDbListener';
import AppShell from '~/components/ui/AppShell.vue';
import UiButton from '~/components/ui/UiButton.vue';
import UiCard from '~/components/ui/UiCard.vue';
import CommentItem from '~/components/CommentItem.vue';
import OptionList from '~/components/OptionList.vue';
import PlayByPlay from '~/components/PlayByPlay.vue';
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
const joinCodeInput = ref('');
const currentIndex = ref(0);
const log = ref('');

// TODO: 開発が終わったらplaceholderに変更
const palette = ['#4F46E5', '#EC4899', '#F97316', '#10B981', '#06B6D4', '#F59E0B'];
const slides = reactive<
  Array<{ id: string; title: string; choices: Array<{ text: string; color?: string }> }>
>([
  {
    id: `slide_0_${Date.now()}`,
    title: '好きな色は？',
    choices: [
      { text: '赤', color: '#EF4444' },
      { text: '青', color: '#3B82F6' },
      { text: '緑', color: '#10B981' },
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
  // assign a palette color immediately so the color picker shows a value
  const idx = slides.length % palette.length;
  slides.push({
    id: `slide_${slides.length}_${Date.now()}`,
    title: '',
    choices: [{ text: '', color: palette[idx] }],
  });
  // switch to the newly added slide
  currentIndex.value = slides.length - 1;
};
const removeSlide = (i: number) => {
  console.debug('presenter: removeSlide', i);
  slides.splice(i, 1);
  // if currentIndex is out of bounds after removal, clamp it
  if (currentIndex.value >= slides.length) {
    currentIndex.value = Math.max(0, slides.length - 1);
  }
};

const onCreateRoom = async () => {
  console.debug('presenter: onCreateRoom called');
  try {
    ensureR();
    const code = await (r as any).createRoom();
    roomCode.value = code;
    log.value = `created ${code}`;
  } catch (e: any) {
    log.value = `create error: ${e.message}`;
  }
};

const onEnterRoom = async () => {
  const code = String(joinCodeInput.value || '').trim();
  if (!code) return;
  try {
    ensureR();
    // try to call joinRoom if available; otherwise just set roomCode to enable controllers
    if ((r as any).joinRoom) {
      await (r as any).joinRoom(code);
    }
    roomCode.value = code;
    log.value = `entered ${code}`;
  } catch (e: any) {
    log.value = `enter error: ${e.message}`;
  }
};

const onSaveSlides = async () => {
  console.debug('presenter: onSaveSlides called');
  if (!roomCode.value) {
    log.value = 'no room';
    return;
  }

  // UI validation: each slide must have at least 2 non-empty choices
  const palette = ['#4F46E5', '#EC4899', '#F97316', '#10B981', '#06B6D4', '#F59E0B'];
  for (const s of slides) {
    const nonEmpty = (s.choices || []).filter((c: any) => c && String(c.text).trim().length > 0);
    if (nonEmpty.length < 2) {
      // user-visible validation
      window.alert(`スライド "${s.title || '無題'}" は最低2つの選択肢が必要です。`);
      return;
    }
  }

  // Normalize slides and auto-assign colors when missing
  const payload = slides.map((s: { title: string; choices: any[] }, si: number) => {
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
    return { title: s.title || 'untitled', choices };
  });

  try {
    ensureR();
    await (r as any).saveSlides(roomCode.value, payload);
    log.value = 'saved slides';
  } catch (e: any) {
    log.value = `save error: ${e.message}`;
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
</script>
