<template>
  <AppShell>
    <div class="max-w-5xl mx-auto grid lg:grid-cols-5 gap-8">
      <!-- Left: Join & Voting -->
      <div class="lg:col-span-3 space-y-6">
        <UiCard>
          <template #header>
            <div class="flex items-center gap-2">
              <span class="text-pink-600 font-bold text-lg">参加者</span>
            </div>
          </template>
          <div class="flex flex-wrap items-center gap-3 mb-4">
            <div v-if="!joined" class="text-sm text-gray-500">
              ルームコードが自動的に適用されます。トップ画面からコードで参加してください。
            </div>
            <div v-if="joined" class="text-xs text-gray-500">
              as <strong class="text-indigo-600">{{ anonId }}</strong>
            </div>
          </div>

          <div v-if="joined && slide" class="space-y-5">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-semibold text-indigo-600">
                Slide {{ slideNumber }}: {{ slide.title }}
              </h2>
              <span class="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full"
                >Total {{ aggregates?.total ?? 0 }}</span
              >
            </div>
            <!-- inline chart removed; main chart appears on right column -->
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
            <div v-if="voted" class="text-xs text-green-600">
              Voted: <strong>{{ myVote }}</strong>
            </div>
          </div>
        </UiCard>
      </div>

      <!-- Right: Chart & Comments (chart first like presenter) -->
      <div class="lg:col-span-2 space-y-6">
        <UiCard
          v-if="aggregates && choicesArray.length"
          title="Live Results"
          titleClass="text-indigo-700"
        >
          <VoteChart :counts="aggregates.counts || {}" :choices="choicesArray" />
        </UiCard>
        <UiCard title="Comments" titleClass="text-pink-600">
          <div v-if="!joined" class="text-xs text-gray-400">参加するとコメントできます。</div>
          <div v-else class="flex gap-3 mb-4">
            <input
              v-model="commentText"
              placeholder="コメントを書く..."
              class="flex-1 border rounded-lg px-3 py-2 focus-ring"
            />
            <UiButton variant="primary" :disabled="!commentText" @pressed="onPostComment"
              >Post</UiButton
            >
          </div>

          <div class="mb-3">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm text-gray-600">実況プレビュー（開発用）</div>
              <UiButton size="sm" variant="secondary" @pressed="fetchPlay">実況更新</UiButton>
            </div>
            <PlayByPlay :text="playText" :loading="playLoading" />
          </div>

          <div class="mb-3">
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm text-gray-600">コメント生成（開発用）</div>
              <UiButton size="sm" variant="secondary" @pressed="fetchComment">生成</UiButton>
            </div>
            <LiveComment :text="commentTextLive" :loading="commentLoading" />
          </div>

          <ul class="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            <CommentItem
              v-for="c in comments"
              :key="c.id"
              :comment="c"
              :currentAnonId="anonId"
              @like="() => onLikeComment(c.id)"
              @delete="() => onDeleteComment(c.id)"
            />
          </ul>
        </UiCard>
        <pre v-if="isDev" class="text-[10px] text-gray-400 whitespace-pre-wrap">{{
          log.join('\n')
        }}</pre>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted, onMounted } from 'vue';
import useRoom from '~/composables/useRoom';
import VoteChart from '~/components/VoteChart.vue';
import createDbListener from '~/composables/useDbListener';
import AppShell from '~/components/ui/AppShell.vue';
import UiButton from '~/components/ui/UiButton.vue';
import UiCard from '~/components/ui/UiCard.vue';
import VoteOption from '~/components/VoteOption.vue';
import CommentItem from '~/components/CommentItem.vue';
import LiveComment from '~/components/LiveComment.vue';
import PlayByPlay from '~/components/PlayByPlay.vue';
import type { Aggregate, Comment as CommentType, Choice, Slide } from '~/types/models';

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
const isDev = false; // simplified: devログ非表示
const playText = ref('');
const playLoading = ref(false);
const commentTextLive = ref('');
const commentLoading = ref(false);
let unsubSlide: (() => void) | null = null;
let unsubSlideContent: (() => void) | null = null;
let unsubAgg: (() => void) | null = null;
let unsubVotes: (() => void) | null = null;
let unsubComments: (() => void) | null = null;
const pushLog = (s: string) => {
  log.value.unshift(`${new Date().toISOString()} ${s}`);
};

// join is now handled via query param on mount; keep helper for backwards compatibility
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
  // auto-join when code supplied as query param
  const nuxt = useNuxtApp();
  const route = nuxt.$router.currentRoute;
  const code = route.value?.query?.code as string | undefined;
  if (code) {
    void onJoin(code);
  }
});

const startListeners = (code: string) => {
  const nuxt = useNuxtApp();
  const db = nuxt.$firebaseDb;

  // slideIndex のリスナー（前のリスナーをクリーンアップ）
  if (unsubSlide) {
    try {
      unsubSlide();
    } catch (e) {
      /* ignore */
    }
  }
  unsubSlide = createDbListener(db, `rooms/${code}/slideIndex`, async (snap: any) => {
    const idx = snap.exists() ? snap.val() : 0;
    slideNumber.value = idx + 1;

    // スライド内容のリスナー
    if (unsubSlideContent) {
      try {
        unsubSlideContent();
      } catch (e) {
        /* ignore */
      }
      unsubSlideContent = null;
    }
    unsubSlideContent = createDbListener(db, `rooms/${code}/slides/slide_${idx + 1}`, (s: any) => {
      slide.value = s.exists() ? (s.val() as Slide) : null;
      if (slide.value && slide.value.choices) {
        choicesArray.value = Object.entries(slide.value.choices).map(([k, v]) => {
          const item = v as { text: string; color?: string };
          return { key: k, text: item.text, color: item.color };
        });
      } else {
        choicesArray.value = [];
      }
    });

    // 集計（aggregates）のリスナー
    if (unsubAgg) {
      try {
        unsubAgg();
      } catch (e) {
        /* ignore */
      }
    }
    unsubAgg = createDbListener(db, `rooms/${code}/aggregates/slide_${idx + 1}`, (snapAgg: any) => {
      const val = snapAgg.exists() ? snapAgg.val() : { counts: {} };
      const agg = val.counts || {};
      Object.keys(counts).forEach((k) => delete counts[k]);
      Object.entries(agg).forEach(([k, v]) => {
        counts[k] = v as number;
      });
      aggregates.value = { counts: agg, total: val.total || 0 };
    });

    // 自分の投票状態を監視するリスナー
    if (unsubVotes) {
      try {
        unsubVotes();
      } catch (e) {
        /* ignore */
      }
    }
    if (anonId.value) {
      unsubVotes = createDbListener(
        db,
        `rooms/${code}/votes/slide_${idx + 1}/${anonId.value}`,
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

    // コメント一覧のリスナー
    if (unsubComments) {
      try {
        unsubComments();
      } catch (e) {
        /* ignore */
      }
    }
    unsubComments = createDbListener(db, `rooms/${code}/comments`, (snap: any) => {
      const arr: UIComment[] = [];
      snap.forEach((child: any) => {
        const v = child.val() as CommentType;
        arr.unshift({ id: child.key as string, ...v });
      });
      comments.value = arr;
    });
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
    const resp = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: slide.value?.title || '', choices: choicesArray.value }),
    });
    const data = await resp.json();
    playText.value = data?.text || '(生成失敗)';
  } catch (e: any) {
    playText.value = '(エラー)';
  } finally {
    playLoading.value = false;
  }
}

async function fetchComment() {
  const code = currentCode.value;
  if (!code) return;
  const choice = choicesArray.value[0];
  commentLoading.value = true;
  try {
    const resp = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: slide.value?.title || '', selectedChoice: choice?.text ?? '' }),
    });
    const data = await resp.json();
    commentTextLive.value = data?.text || '(生成失敗)';
  } catch (e: any) {
    commentTextLive.value = '(エラー)';
  } finally {
    commentLoading.value = false;
  }
}

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
