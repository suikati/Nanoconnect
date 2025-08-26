<template>
  <AppShell>
  <div class="max-w-6xl mx-auto grid xl:grid-cols-5 gap-8">
  <!-- 左カラム: 編集 / 並び替え -->
      <div class="xl:col-span-3 space-y-6">
  <SlideControls
          :slides="slides"
          :current-index="currentIndex"
          :reorder-dirty="reorderDirty"
          :room-code="roomCode"
          :saving-slides="savingSlides"
          @add="addSlide"
          @save="onSaveSlides"
          @select="setIdx"
          @move="onMoveSlide"
          @remove="removeSlide"
        >
          <SlideEditor
            :slide="slides[currentIndex] || null"
            :index="currentIndex"
            :total="slides.length"
            @update:title="(v) => { if(slides[currentIndex]) slides[currentIndex].title = v; }"
            @update:choices="(v:any[]) => { if(slides[currentIndex]) slides[currentIndex].choices = v as any; }"
            @update:chartType="(t) => setChartType(t)"
            @prev="prevSlide"
            @next="nextSlide"
            @dirty="reorderDirty = true"
          />
        </SlideControls>
      </div>

  <!-- 右カラム: Live 結果 + コメント -->
  <div class="xl:col-span-2 space-y-6">
        <LivePanelWrapper
          v-if="localLiveChoices.length"
          :counts="aggregates?.counts || {}"
          :choices="localLiveChoices"
          :play-text="playText"
          :play-loading="playLoading"
          :chart-type="activeChartType"
          @refresh="fetchPlay"
        />
  <UiCard v-if="roomCode" title="Comments" titleClass="font-display font-semibold text-rose-600" variant="glass" padding="md">
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
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
// SSR 無効化: Chart.js / window 依存によるサーバエラー回避
definePageMeta({ ssr: false });
import { reactive, ref, onMounted, watch, onUnmounted, nextTick } from 'vue';
import useRoom from '~/composables/useRoom';
import createDbListener from '~/composables/useDbListener';
import AppShell from '~/components/ui/AppShell.vue';
import UiButton from '~/components/ui/UiButton.vue';
import UiCard from '~/components/ui/UiCard.vue';
import CommentItem from '~/components/CommentItem.vue';
import LiveResultsPanel from '~/components/LiveResultsPanel.vue'; // ラッパ内部利用のため明示インポート（ツリーシェイク抑止）
import LivePanelWrapper from '~/components/LivePanelWrapper.vue';
import SlideControls from '~/components/SlideControls.vue';
import SlideEditor from '~/components/SlideEditor.vue';
import type { Aggregate, Comment as CommentType, Choice, Slide } from '~/types/models';
import { slideIndexPath, slidePath, aggregatesPath, commentsPath, roomPath } from '~/utils/paths';
import { migrateLegacyChoiceIds } from '~/utils/migration';

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

// TODO: 開発終了後 placeholder へ差し替え検討
const palette = ['#4F46E5', '#EC4899', '#F97316', '#10B981', '#06B6D4', '#F59E0B'];
const slides = reactive<
  Array<{ id: string; title: string; chartType?: 'bar' | 'pie'; choices: Array<{ id?: string; text: string; color?: string }> }>
>([
  {
    id: `slide_0_${Date.now()}`,
    title: '好きな色は？',
    choices: [
      { id: `ch_${Math.random().toString(36).slice(2,10)}`, text: '赤', color: '#EF4444' },
      { id: `ch_${Math.random().toString(36).slice(2,10)}`, text: '青', color: '#3B82F6' },
      { id: `ch_${Math.random().toString(36).slice(2,10)}`, text: '緑', color: '#10B981' },
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
    // audience 側と揃えて votes を付与（割合計算に必要）
    const countsMap = aggregates.value?.counts || {};
    const choicesForApi = currentSlideChoices.value.map(c => ({ id: c.key, text: c.text, votes: countsMap[c.key] || 0 }));
    const resp = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: slides[currentIndex.value]?.title || '', choices: choicesForApi }),
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
let unsubAllSlides: (() => void) | null = null; // 全スライド同期用

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
    choices: [{ id: `ch_${Math.random().toString(36).slice(2,10)}`, text: '', color: palette[idx] }],
  });
  currentIndex.value = slides.length - 1;
  nextTick(() => { try { titleInput.value?.focus(); } catch (e) {} });
  reorderDirty.value = true;
};
const removeSlide = (i: number) => {
  console.debug('presenter: removeSlide', i);
  slides.splice(i, 1);
  // 削除後に currentIndex が範囲外なら末尾へ丸め
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
  // 一時的にリスナー反映を抑制してから再開
  setTimeout(() => (suppressSlideSync.value = false), 250);
};

// ルーム作成/入室 UI は index.vue へ移行済。presenter は URL クエリ code で自動参加

const onSaveSlides = async () => {
  console.debug('presenter: onSaveSlides called');
  log.value = '[debug] 保存開始';
  try { window.dispatchEvent(new CustomEvent('nanopoll-save-attempt')); } catch(e){}
  if (!roomCode.value) {
  log.value = 'roomCode 未設定のため保存できません (URL に ?code=XXXX があるか確認)';
  window.alert('ルームが未作成または URL の code クエリがありません。先にトップでルームを作成してください。');
    return;
  }
  savingSlides.value = true;

  // バリデーション: 各スライド最低2つの非空選択肢
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

  // 正規化: 色欠如へ自動割当 / 空白トリム
  const payload = slides.map((s: { title: string; chartType?: 'bar' | 'pie'; choices: any[] }, si: number) => {
    const choices = (s.choices || []).map((c: any, ci: number) => {
      const rawColor = c && c.color ? String(c.color) : '';
      const placeholder = '#f3f4f6';
      const normalizedColor = rawColor && rawColor.toLowerCase() !== placeholder
        ? rawColor
        : palette[(ci + si) % palette.length];
      const obj: any = { id: c.id, text: String(c.text || '').trim() };
      if (normalizedColor) obj.color = normalizedColor;
      return obj;
    });
    return { title: s.title || 'untitled', chartType: (s.chartType || 'bar'), choices };
  });

  try {
    ensureR();
    const keepId = slides[currentIndex.value]?.id;
  log.value += '\n[debug] saveSlides 呼び出し';
  await (r as any).saveSlides(roomCode.value, payload);
  log.value += '\n[debug] saveSlides 成功';
  // 保存後: 現在スライド id の新 index を再計算し共有 slideIndex へ反映
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
  log.value = `save error: ${e?.message || e}`;
  } finally {
    savingSlides.value = false;
  }
};

const setIdx = async (idx: number) => {
  // 要求 index を範囲内へ丸め
  const len = slides.length;
  const clamped = len > 0 ? Math.max(0, Math.min(idx, len - 1)) : 0;

  // room 未確定時はローカルのみ更新
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
  // クエリ code 取得し自動入室
  try {
    const nuxt = useNuxtApp();
    const qCode = (nuxt.$router.currentRoute.value.query.code as string) || '';
    if (qCode) roomCode.value = qCode;
  } catch (e) { /* ignore */ }
  // ルーム存在時のみ集計監視
});

// audience と同様: roomCode 設定後に slideIndex + スライド購読開始
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

  // 全スライドリスナー: 再入室やリロード時に現在スライド以外が欠落しないよう同期
  if (unsubAllSlides) { try { unsubAllSlides(); } catch(e){} unsubAllSlides = null; }
  unsubAllSlides = createDbListener(db, `${roomPath(val)}/slides`, (snap: any) => {
    if (!snap || !snap.exists()) return;
    // 既存配列を維持しつつ順序再構築: slide_1, slide_2 ... のキー順で並び替え
    const entries: Array<{ id: string; title: string; chartType?: 'bar'|'pie'; choices: any[]; slideNumber: number }> = [];
    snap.forEach((child: any) => {
      const key = child.key as string; // e.g. slide_1
      const val = child.val() as Slide;
      const num = typeof val.slideNumber === 'number' ? val.slideNumber : (Number(key.split('_')[1]) || 0);
      const choiceArr = val.choices ? Object.entries(val.choices)
        .map((e:any, i:number) => { const [cid, cv] = e; const it:any = cv; return { id: cid, text: it.text || '', color: it.color, _order: typeof it.index==='number'? it.index : i }; })
        .sort((a,b)=> a._order - b._order)
        .map(o=> ({ id: o.id, text: o.text, color: o.color })) : [];
      entries.push({ id: key, title: val.title || '', chartType: (val as any).chartType || 'bar', choices: choiceArr, slideNumber: num });
    });
    entries.sort((a,b)=> a.slideNumber - b.slideNumber);
    // ローカル slides を差し替え（参照維持）
    // 抑制フラグ中はユーザ手動並び替えが優先なので上書きしない
    if (suppressSlideSync.value) return;
    // 既存と同一ならスキップ
    const sameLength = slides.length === entries.length;
    const same = sameLength && entries.every((e,i)=> slides[i] && slides[i].id === e.id);
    if (!same) {
      slides.splice(0, slides.length, ...entries.map(e => ({ id: e.id, title: e.title, chartType: e.chartType, choices: e.choices })));
      // currentIndex が範囲外になった場合丸め
      if (currentIndex.value >= slides.length) currentIndex.value = Math.max(0, slides.length - 1);
    }
  });

  // slideIndex のリスナー（前のリスナーをクリーンアップ）
  if (unsubSlideIndex) {
    unsubSlideIndex();
    unsubSlideIndex = null;
  }
  unsubSlideIndex = createDbListener(db, slideIndexPath(val), (snap: any) => {
    if (!snap) return;
    const idx = snap.val();
    currentIndex.value = typeof idx === 'number' ? idx : 0;

  // スライド内容リスナー
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
  slidePath(val, (currentIndex.value || 0)),
      (s: any) => {
    if (suppressSlideSync.value) return; // 並び替え直後の一時抑制
        const slideObj = s && s.val ? (s.val() as Slide) : null;
        if (slideObj && slideObj.choices) {
          // index プロパティでソート（欠如時は元順）
          const entries = Object.entries(slideObj.choices).map((e, i) => {
            const [k, v] = e;
            const it = v as any;
            return { key: k, text: it.text, color: it.color, _order: typeof it.index === 'number' ? it.index : i };
          }).sort((a, b) => a._order - b._order);
          currentSlideChoices.value = entries.map(e => ({ key: e.key, text: e.text, color: e.color }));
        } else {
          currentSlideChoices.value = [];
        }

  // DB 内容を editor モデルにも反映（カラー等 UI 再同期）
        try {
          const slideObj2 = slideObj;
          if (slideObj2) {
            const idx = currentIndex.value || 0;
            const editorChoices = slideObj2.choices
              ? Object.entries(slideObj2.choices)
                  .map((e, i) => {
                    const [k, v] = e;
                    const it = v as any;
                    return { id: k, text: it.text || '', color: it.color, _order: typeof it.index === 'number' ? it.index : i };
                  })
                  .sort((a, b) => a._order - b._order)
                  .map(o => ({ id: o.id, text: o.text, color: o.color }))
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

  // 集計リスナー
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
      aggregatesPath(val, (currentIndex.value || 0)),
      async (snap: any) => {
        const a = snap && snap.val ? snap.val() : null;
        aggregates.value = a || { counts: {}, total: 0 };
        try {
          const slideId = `slide_${(currentIndex.value || 0) + 1}`;
          if (currentSlideChoices.value.length) {
            await migrateLegacyChoiceIds(db, val, slideId, { ...(slides[currentIndex.value] as any), slideNumber: (currentIndex.value||0)+1, choices: Object.fromEntries(currentSlideChoices.value.map((c,i)=> [c.key, { text: c.text, index: i, color: c.color }])) }, a);
          }
        } catch(e) { /* ignore */ }
      },
    );

  // コメントリスナー
    if (unsubComments) {
      try {
        (unsubComments as any)();
      } catch (e) {
        /* ignore */
      }
      unsubComments = null;
    }
  unsubComments = createDbListener(db, commentsPath(val), (snap: any) => {
      const arr: UIComment[] = [];
      snap.forEach((child: any) => {
        arr.unshift({ id: child.key as string, ...(child.val() as CommentType) });
      });
      comments.value = arr;
    });
  });
});

// コンポーネント破棄時クリーンアップ
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

// 防御: currentIndex が範囲外（削除等）の場合丸め
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

// 未保存時: DB choices 不在 → ローカル値を Live 表示へフォールバック
const localLiveChoices = computed(() => {
  if (currentSlideChoices.value.length > 0) return currentSlideChoices.value; // DB 反映済み
  const s = slides[currentIndex.value];
  if (!s) return [];
  return (s.choices || []).map((c, idx) => ({ key: c.id || `choice_${idx}`, text: c.text || '', color: c.color }));
});

function setChartType(t: 'bar' | 'pie') {
  const s = slides[currentIndex.value];
  if (!s) return;
  if (s.chartType === t) return;
  s.chartType = t;
  reorderDirty.value = true;
}
</script>
