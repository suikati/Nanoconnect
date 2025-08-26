<template>
  <AppShell>
  <div class="max-w-5xl mx-auto grid lg:grid-cols-5 gap-8">
  <!-- メイン領域 (スライド + 投票 + Live) -->
      <div class="lg:col-span-5 xl:col-span-3 space-y-6">
        <UiCard variant="glass" interactive padding="md">
          <template #header>
            <div class="flex items-center gap-3 flex-wrap">
              <span class="text-emerald-600 font-display font-bold text-base sm:text-lg">Questionnaire</span>
              <button
                v-if="currentCode"
                @click="copyRoomCode"
                type="button"
                class="group relative text-[10px] sm:text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-mono tracking-wide focus:outline-none focus:ring-2 focus:ring-emerald-300 hover:bg-emerald-100 transition"
                :title="copied ? 'Copied!' : 'クリックでコピー'"
              >
                <span>{{ copied ? 'Copied!' : currentCode }}</span>
              </button>
            </div>
          </template>
          <div class="flex flex-wrap items-center gap-3 mb-4 text-xs sm:text-sm">
            <div v-if="!joined" class="text-gray-500">
              ルームコードが自動的に適用されます。トップ画面からコードで参加してください。
            </div>
            <!-- <div v-if="joined" class="text-gray-500">
              as <strong class="text-primary-600 font-mono">{{ anonId }}</strong>
            </div> -->
          </div>

          <div v-if="joined && slide" class="space-y-8">
            <div class="flex items-start justify-between gap-4 text-xs sm:text-sm">
              <div class="flex flex-col flex-1 min-w-0">
                <div class="flex items-baseline gap-2 flex-wrap">
                  <span class="px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 font-semibold text-[10px] sm:text-[11px] tracking-wide">Slide {{ slideNumber }}</span>
                  <h2 class="font-semibold text-primary-700 tracking-tight text-sm sm:text-base leading-snug truncate flex-1">{{ slide.title || '無題スライド' }}</h2>
                </div>
              </div>
              <span class="text-[10px] sm:text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded-full font-mono tracking-wide whitespace-nowrap">Total {{ aggregates?.total ?? 0 }}</span>
            </div>
            <!-- 投票オプション一覧 -->
            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <li v-for="(c, idx) in choicesArray" :key="idx">
                <VoteOption
                  :choice="c"
                  :count="counts[c.key] ?? 0"
                  :selected="myVote === c.key"
                  :disabled="voted || voting"
                  @vote="onVote"
                />
              </li>
            </ul>
            <!-- LiveComment: 投票後自動生成 → 下部に表示 -->
            <div class="mt-3">
              <LiveComment :text="commentTextLive" :loading="commentLoading" />
            </div>
            <!-- <div v-if="voted" class="text-xs text-green-600">
              Voted: <strong>{{ myVote }}</strong>
            </div> -->

          </div>
        </UiCard>
  <!-- 独立 Live パネルカード -->
        <UiCard
          v-if="joined && slide && choicesArray.length"
          variant="glass"
          interactive
          padding="md"
          class="live-big"
        >
          <template #header>
            <div class="flex items-center justify-between w-full">
              <span class="text-primary-600 font-display font-bold text-sm sm:text-base">Live</span>
              <UiButton size="sm" variant="secondary" @pressed="fetchPlay">実況更新</UiButton>
            </div>
          </template>
          <LiveResultsPanel
            :counts="aggregates?.counts || {}"
            :choices="choicesArray"
            :play-text="playText"
            :play-loading="playLoading"
            :chart-type="(slide?.chartType as any) || 'bar'"
          />
        </UiCard>
      </div>
      <!-- Comments Side: 固定高 862px（越えたら内部スクロール） -->
      <div class="lg:col-span-5 xl:col-span-2">
  <UiCard title="Comments" titleClass="font-display font-semibold text-rose-600" variant="glass" padding="md" class="h-[862px] flex flex-col">
          <div class="flex flex-col gap-4 xl:flex-1 xl:min-h-0">
          <div v-if="!joined" class="text-[10px] sm:text-xs text-gray-400">参加するとコメントできます。</div>
          <div v-else class="flex gap-3 mb-4">
            <input
              v-model="commentText"
              placeholder="コメント、質問お待ちしてます！"
              class="flex-1 border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/60 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white/80"
            />
            <UiButton variant="primary" :disabled="!commentText" @pressed="onPostComment">ポスト</UiButton>
          </div>
          <!-- LiveComment は投票ブロック直下 / Live パネルはスライド下へ配置 -->
          <ul class="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0">
            <CommentItem
              v-for="c in comments"
              :key="c.id"
              :comment="c"
              :currentAnonId="anonId"
              @like="() => onLikeComment(c.id)"
              @delete="() => onDeleteComment(c.id)"
            />
          </ul>
          </div>
        </UiCard>
  <pre v-if="isDev" class="text-[10px] text-gray-400 whitespace-pre-wrap">{{ log.join('\n') }}</pre>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
definePageMeta({ ssr: false });
import { ref, reactive, onUnmounted, onMounted } from 'vue';
import useLiveCommentGenerator from '~/composables/useLiveCommentGenerator';
import { ref as dbRef, runTransaction, update } from 'firebase/database';
import useRoom from '~/composables/useRoom';
import VoteChart from '~/components/VoteChart.vue';
import LiveResultsPanel from '~/components/LiveResultsPanel.vue';
import createDbListener from '~/composables/useDbListener';
import AppShell from '~/components/ui/AppShell.vue';
import UiButton from '~/components/ui/UiButton.vue';
import UiCard from '~/components/ui/UiCard.vue';
import VoteOption from '~/components/VoteOption.vue';
import CommentItem from '~/components/CommentItem.vue';
import LiveComment from '~/components/LiveComment.vue';
import type { Aggregate, Comment as CommentType, Choice, Slide } from '~/types/models';
import { slideIndexPath, slidePath, aggregatesPath, votesPath, commentsPath, liveCommentPath } from '~/utils/paths';
import { migrateLegacyChoiceIds } from '~/utils/migration';

// ここで使う composable の簡易 API 形
type RoomApi = {
  joinRoom: (code: string) => Promise<{ anonId: string }>;
  submitVoteSafe: (code: string, slideId: string, choiceKey: string) => Promise<boolean>;
  pushComment: (code: string, text: string) => Promise<void>;
  likeComment: (code: string, commentId: string) => Promise<void>;
  deleteComment: (code: string, commentId: string) => Promise<void>;
  createRoom?: () => Promise<string>;
  saveSlides?: (code: string, slides: any[]) => Promise<void>;
};

type UIComment = CommentType & { id: string };

let r: RoomApi | null = null;
const ensureR = () => {
  if (!r) r = useRoom() as unknown as RoomApi;
  return r;
};
const joined = ref(false);
const anonId = ref('');
const slide = ref<Slide | null>(null);
const slideNumber = ref<number>(0);
const choicesArray = ref<Choice[]>([]);
const counts = reactive<Record<string, number>>({});
const myVote = ref<string | null>(null);
const voted = ref(false);
const voting = ref(false);
const log = ref<string[]>([]);
const aggregates = ref<Aggregate | null>(null);
const commentText = ref('');
const comments = ref<UIComment[]>([]);
const currentCode = ref<string | null>(null);
const copied = ref(false);
const isDev = false; // simplified: devログ非表示
const playText = ref('');
const playLoading = ref(false);
const commentTextLive = ref('');
const commentLoading = ref(false); // will mirror composable state
const liveCommentError = ref<string | null>(null);
let liveGen: ReturnType<typeof useLiveCommentGenerator> | null = null;
let unsubSlide: (() => void) | null = null;
let unsubSlideContent: (() => void) | null = null;
let unsubAgg: (() => void) | null = null;
let unsubVotes: (() => void) | null = null;
let unsubComments: (() => void) | null = null;
let unsubLiveComment: (() => void) | null = null;
const pushLog = (s: string) => {
  log.value.unshift(`${new Date().toISOString()} ${s}`);
};

// 参加: マウント時のクエリ param で自動処理（後方互換ヘルパ維持）
const onJoin = async (code?: string) => {
  try {
    const roomCode = code || (useNuxtApp().$router.currentRoute.value.query.code as string) || '';
    if (!roomCode) return;
    currentCode.value = roomCode;
    ensureR();
    const res = await (r as any).joinRoom(roomCode);
    anonId.value = res.anonId;
    joined.value = true;
    pushLog(`joined ${roomCode} as ${anonId.value}`);
    startListeners(roomCode);
  } catch (e: any) {
    pushLog('join error: ' + e.message);
  }
};

onMounted(() => {
  // クライアント専用の composable を初期化
  ensureR();
  // クエリに code があれば自動参加
  const nuxt = useNuxtApp();
  const route = nuxt.$router.currentRoute;
  const code = route.value?.query?.code as string | undefined;
  if (code) {
    void onJoin(code);
  }
});

async function copyRoomCode() {
  try {
    if (currentCode.value) {
      await navigator.clipboard.writeText(currentCode.value);
      copied.value = true;
      setTimeout(() => (copied.value = false), 1600);
    }
  } catch (e) {
    copied.value = false;
  }
}

const startListeners = (code: string) => {
  const nuxt = useNuxtApp();
  const _db = nuxt.$firebaseDb;

  // slideIndex リスナー（先行リスナー解除）
  if (unsubSlide) {
    try {
      unsubSlide();
    } catch (e) {
      /* ignore */
    }
  }
  unsubSlide = createDbListener(_db, slideIndexPath(code), async (snap: any) => {
    const idx = snap.exists() ? snap.val() : 0;
    slideNumber.value = idx + 1;

  // スライド内容リスナー
    if (unsubSlideContent) {
      try {
        unsubSlideContent();
      } catch (e) {
        /* ignore */
      }
      unsubSlideContent = null;
    }
  unsubSlideContent = createDbListener(_db, slidePath(code, idx), (s: any) => {
      slide.value = s.exists() ? (s.val() as Slide) : null;
      if (slide.value && slide.value.choices) {
        // index プロパティに基づき並び順を復元
        const entries = Object.entries(slide.value.choices).map((e, i) => {
          const [k, v] = e; const it = v as any;
          return { key: k, text: it.text, color: it.color, _order: typeof it.index === 'number' ? it.index : i };
        }).sort((a, b) => a._order - b._order);
        choicesArray.value = entries.map(e => ({ key: e.key, text: e.text, color: e.color }));
      } else {
        choicesArray.value = [];
      }
    });

  // 集計リスナー
    if (unsubAgg) {
      try {
        unsubAgg();
      } catch (e) {
        /* ignore */
      }
    }
  unsubAgg = createDbListener(_db, aggregatesPath(code, idx), async (snapAgg: any) => {
      const val = snapAgg.exists() ? snapAgg.val() : { counts: {} };
      const agg = val.counts || {};
      Object.keys(counts).forEach((k) => delete counts[k]);
      Object.entries(agg).forEach(([k, v]) => { counts[k] = v as number; });
      aggregates.value = { counts: agg, total: val.total || 0 };
      // Attempt migration only after both slide and aggregates loaded
      try {
        if (slide.value) {
          const slideId = `slide_${idx + 1}`;
          await migrateLegacyChoiceIds(_db, code, slideId, slide.value as any, val);
        }
      } catch(e) { /* ignore migration failure */ }
    });

  // 自分の票リスナー
    if (unsubVotes) {
      try {
        unsubVotes();
      } catch (e) {
        /* ignore */
      }
    }
    if (anonId.value) {
      unsubVotes = createDbListener(
        _db,
  votesPath(code, idx, anonId.value),
        (s: any) => {
          if (s.exists()) {
            myVote.value = s.val().choiceId as string;
            voted.value = true;
          } else {
            myVote.value = null;
            voted.value = false;
          }
        },
      );
    } else {
      myVote.value = null;
      voted.value = false;
    }

  // コメントリスナー
    if (unsubComments) {
      try {
        unsubComments();
      } catch (e) {
        /* ignore */
      }
    }
  unsubComments = createDbListener(_db, commentsPath(code), (snap: any) => {
      const arr: UIComment[] = [];
      snap.forEach((child: any) => {
        const v = child.val() as CommentType;
        arr.unshift({ id: child.key as string, ...v });
      });
      comments.value = arr;
    });

  // LiveComment リスナー
    if (unsubLiveComment) {
      try { unsubLiveComment(); } catch (e) { /* ignore */ }
      unsubLiveComment = null;
    }
  unsubLiveComment = createDbListener(_db, liveCommentPath(code, idx), (snap: any) => {
      if (!snap.exists()) {
        commentTextLive.value = '';
        liveCommentError.value = null;
        commentLoading.value = false;
        return;
      }
      const lc = snap.val() as any;
      commentTextLive.value = lc.text || '';
      liveCommentError.value = lc.error || null;
      commentLoading.value = !!lc.generating;
    });
    // update generator instance for current slide
    const db2 = (useNuxtApp() as any).$firebaseDb;
    if (db2 && currentCode.value && anonId.value) {
      liveGen = useLiveCommentGenerator(db2, currentCode.value, anonId.value);
    }
  });
};

const onVote = async (choiceKey: string) => {
  const code = currentCode.value;
  try {
    ensureR();
    voting.value = true;
    const ok = await (r as any).submitVoteSafe(code, `slide_${slideNumber.value}`, choiceKey);
    if (ok) {
      pushLog(`voted ${choiceKey}`);
      voted.value = true;
      myVote.value = choiceKey;
  // 自動 LiveComment 生成試行（composable 呼び出し）
  try {
    if (liveGen && slideNumber.value > 0) {
      const c = choicesArray.value.find(c => c.key === choiceKey);
      if (c) await liveGen.generate(slideNumber.value - 1, slide.value?.title || '', choiceKey, c.text);
    }
  } catch(e) { /* ignore generation failure */ }
    } else {
      pushLog('vote was no-op (same choice)');
    }
    voting.value = false;
  } catch (e: any) {
    pushLog('vote error: ' + e.message);
  }
};

onUnmounted(() => {
  if (unsubSlide) unsubSlide();
  if (unsubSlideContent) {
    try {
      unsubSlideContent();
    } catch (e) {
      /* ignore */
    }
  }
  if (unsubAgg) unsubAgg();
  if (unsubVotes) unsubVotes();
  if (unsubComments) unsubComments();
});

const onPostComment = async () => {
  const code = currentCode.value;
  if (!code) return;
  const text = commentText.value.trim();
  if (!text) return;
  try {
    ensureR();
    await (r as any).pushComment(code, text);
    pushLog('comment posted');
    commentText.value = '';
  } catch (e: any) {
    pushLog('comment error: ' + e.message);
  }
};

async function fetchPlay() {
  const code = currentCode.value;
  if (!code) return;
  playLoading.value = true;
  try {
  // サーバ側割合計算用に votes 含むペイロード構築
    const choicesForApi = choicesArray.value.map((c) => ({ id: c.key, text: c.text, votes: counts[c.key] ?? 0 }));
    const resp = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: slide.value?.title || '', choices: choicesForApi }),
    });
    const data = await resp.json();
    playText.value = data?.text || '(生成失敗)';
  } catch (e: any) {
    playText.value = '(エラー)';
  } finally {
    playLoading.value = false;
  }
}

// ===== LiveComment 自動生成ロジック =====
const LIVE_COMMENT_COOLDOWN_MS = 10000; // 同一内容再生成の最小間隔
const LIVE_COMMENT_LOCK_TIMEOUT_MS = 30000; // generating ロックが残った際の再取得猶予


const onLikeComment = async (commentId: string) => {
  const code = currentCode.value;
  try {
    ensureR();
    await (r as any).likeComment(code, commentId);
  } catch (e: any) {
    pushLog('like error: ' + e.message);
  }
};

const onDeleteComment = async (commentId: string) => {
  const code = currentCode.value;
  try {
    ensureR();
    await (r as any).deleteComment(code, commentId);
  } catch (e: any) {
    pushLog('delete error: ' + e.message);
  }
};
</script>
