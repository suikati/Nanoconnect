<template>
  <div class="min-h-screen bg-gradient-to-br from-white to-yellow-50 p-6">
    <div class="max-w-3xl mx-auto">
      <div class="bg-white rounded-2xl shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-bold text-pink-600">Audience</h1>
          <div class="flex items-center gap-2">
            <input v-model="codeInput" placeholder="Room code" class="border rounded-lg px-3 py-2 w-40" />
            <button @click="onJoin" class="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600">Join</button>
          </div>
        </div>

        <div v-if="joined" class="mb-4 text-sm text-gray-600">joined as <strong class="text-indigo-600">{{ anonId }}</strong></div>

        <section v-if="joined && slide" class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-indigo-700">Slide {{ slideNumber }}: {{ slide.title }}</h3>
            <div class="text-sm text-gray-500">Total: {{ aggregates?.total ?? 0 }}</div>
          </div>

          <div v-if="aggregates" class="mb-4">
            <VoteChart :counts="aggregates.counts || {}" :choices="choicesArray" />
          </div>

          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <li v-for="(c, idx) in choicesArray" :key="idx">
              <button @click="onVote(c.key)" :disabled="voted || voting" class="w-full text-left bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-4 py-3 flex items-center justify-between">
                <span class="font-medium text-indigo-700">{{ c.text }}</span>
                <span class="text-indigo-500">{{ counts[c.key] ?? 0 }}</span>
              </button>
            </li>
          </ul>

          <div v-if="voted" class="mt-3 text-sm text-green-600">You voted: <strong>{{ myVote }}</strong></div>
        </section>

        <section v-if="joined" class="mt-4">
          <h3 class="text-lg font-semibold text-pink-600 mb-3">Comments</h3>
          <div class="flex gap-3 mb-4">
            <input v-model="commentText" placeholder="Write a comment..." class="flex-1 border rounded-lg px-3 py-2" />
            <button @click="onPostComment" :disabled="!commentText" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Post</button>
          </div>

          <ul class="space-y-3">
            <li v-for="c in comments" :key="c.id" class="p-3 bg-gray-50 rounded-lg border">
              <div class="flex items-center justify-between">
                <small class="text-xs text-gray-500">{{ new Date(c.createdAt).toLocaleTimeString() }}</small>
                <div class="text-sm text-gray-400">{{ c.anonId ? '' : '' }}</div>
              </div>
              <div class="mt-2">
                <em v-if="c.deleted" class="text-gray-400">(削除済み)</em>
                <span v-else class="text-gray-800">{{ c.text }}</span>
              </div>
              <div class="mt-3 flex items-center gap-3">
                <button @click="onLikeComment(c.id)" :disabled="c.deleted" class="text-sm px-3 py-1 rounded-full border hover:bg-indigo-50">
                  <span class="mr-2">{{ (c.userLikes && c.userLikes[anonId]) ? '💙' : '👍' }}</span>
                  <span class="text-sm text-gray-700">{{ c.likes || 0 }}</span>
                </button>
                <button v-if="!c.deleted && c.anonId === anonId" @click="onDeleteComment(c.id)" class="text-sm text-red-500 hover:underline">Delete</button>
              </div>
            </li>
          </ul>
        </section>

        <pre class="mt-6 text-xs text-gray-400">{{ log.join('\n') }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted, onMounted } from 'vue';
import useRoom from '~/composables/useRoom';
import VoteChart from '~/components/VoteChart.vue';
import createDbListener from '~/composables/useDbListener';
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
const ensureR = () => { if (!r) r = useRoom() as unknown as RoomApi; return r; };
const codeInput = ref('');
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
let unsubSlide: (() => void) | null = null;
let unsubSlideContent: (() => void) | null = null;
let unsubAgg: (() => void) | null = null;
let unsubVotes: (() => void) | null = null;
let unsubComments: (() => void) | null = null;
const pushLog = (s: string) => { log.value.unshift(`${new Date().toISOString()} ${s}`); };

const onJoin = async () => {
  try {
    const code = codeInput.value;
    ensureR();
    const res = await (r as any).joinRoom(code);
    anonId.value = res.anonId;
    joined.value = true;
    pushLog(`joined ${code} as ${anonId.value}`);
    startListeners(code);
  } catch (e: any) {
    pushLog('join error: ' + e.message);
  }
};

onMounted(() => {
  // クライアント専用の composable を初期化
  ensureR();
});

const startListeners = (code: string) => {
  const nuxt = useNuxtApp();
  const db = nuxt.$firebaseDb;

  // slideIndex のリスナー（前のリスナーをクリーンアップ）
  if (unsubSlide) { try { unsubSlide(); } catch (e) { /* ignore */ } }
  unsubSlide = createDbListener(db, `rooms/${code}/slideIndex`, async (snap: any) => {
    const idx = snap.exists() ? snap.val() : 0;
    slideNumber.value = idx + 1;

  // スライド内容のリスナー
    if (unsubSlideContent) { try { unsubSlideContent(); } catch (e) { /* ignore */ } unsubSlideContent = null; }
    unsubSlideContent = createDbListener(db, `rooms/${code}/slides/slide_${idx + 1}`, (s: any) => {
      slide.value = s.exists() ? s.val() as Slide : null;
      if (slide.value && slide.value.choices) {
        choicesArray.value = Object.entries(slide.value.choices).map(([k, v]) => {
          const item = v as { text: string; index?: number };
          return { key: k, text: item.text };
        });
      } else {
        choicesArray.value = [];
      }
    });

  // 集計（aggregates）のリスナー
    if (unsubAgg) { try { unsubAgg(); } catch (e) { /* ignore */ } }
    unsubAgg = createDbListener(db, `rooms/${code}/aggregates/slide_${idx + 1}`, (snapAgg: any) => {
      const val = snapAgg.exists() ? snapAgg.val() : { counts: {} };
      const agg = val.counts || {};
      Object.keys(counts).forEach(k => delete counts[k]);
      Object.entries(agg).forEach(([k, v]) => { counts[k] = v as number; });
      aggregates.value = { counts: agg, total: val.total || 0 };
    });

  // 自分の投票状態を監視するリスナー
    if (unsubVotes) { try { unsubVotes(); } catch (e) { /* ignore */ } }
    if (anonId.value) {
      unsubVotes = createDbListener(db, `rooms/${code}/votes/slide_${idx + 1}/${anonId.value}`, (s: any) => {
        if (s.exists()) {
          myVote.value = s.val().choiceId as string;
          voted.value = true;
        } else {
          myVote.value = null;
          voted.value = false;
        }
      });
    } else {
      myVote.value = null;
      voted.value = false;
    }

  // コメント一覧のリスナー
    if (unsubComments) { try { unsubComments(); } catch (e) { /* ignore */ } }
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
  const code = codeInput.value;
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
  } catch (e: any) { pushLog('vote error: ' + e.message); }
};

onUnmounted(() => {
  if (unsubSlide) unsubSlide();
  if (unsubSlideContent) { try { unsubSlideContent(); } catch (e) { /* ignore */ } }
  if (unsubAgg) unsubAgg();
  if (unsubVotes) unsubVotes();
  if (unsubComments) unsubComments();
});

const onPostComment = async () => {
  const code = codeInput.value;
  if (!code) return;
  const text = commentText.value.trim();
  if (!text) return;
  try {
    ensureR();
    await (r as any).pushComment(code, text);
    pushLog('comment posted');
    commentText.value = '';
  } catch (e: any) { pushLog('comment error: ' + e.message); }
};

const onLikeComment = async (commentId: string) => {
  const code = codeInput.value;
  try {
    ensureR();
    await (r as any).likeComment(code, commentId);
  } catch (e: any) { pushLog('like error: ' + e.message); }
};

const onDeleteComment = async (commentId: string) => {
  const code = codeInput.value;
  try {
    ensureR();
    await (r as any).deleteComment(code, commentId);
  } catch (e: any) { pushLog('delete error: ' + e.message); }
};
</script>