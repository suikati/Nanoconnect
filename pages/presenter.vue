<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-yellow-50 p-6">
    <div class="max-w-4xl mx-auto">
      <div class="bg-white rounded-2xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-2xl font-extrabold text-indigo-600">Presenter</h1>
          <div>
            <button @click="onCreateRoom" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Create Room</button>
            <span v-if="roomCode" class="ml-3 text-sm text-gray-600">Room: <strong class="text-indigo-700">{{ roomCode }}</strong></span>
          </div>
        </div>

        <section class="mb-6">
          <h3 class="text-lg font-semibold text-gray-700 mb-3">Slides (max 5)</h3>
          <div v-for="(s, i) in slides" :key="i" class="mb-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
            <input v-model="s.title" placeholder="Slide title" class="col-span-2 border rounded-lg px-3 py-2" />
            <input v-model="s.choicesText" placeholder="Choices (comma separated)" class="col-span-2 sm:col-span-3 border rounded-lg px-3 py-2 mt-2 sm:mt-0" />
            <button @click="removeSlide(i)" class="text-sm text-red-500 hover:underline">Remove</button>
          </div>
          <div class="flex items-center gap-3">
            <button @click="addSlide" :disabled="slides.length >= 5" class="bg-pink-500 text-white px-3 py-2 rounded-lg hover:bg-pink-600">Add Slide</button>
            <button @click="onSaveSlides" :disabled="!roomCode" class="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600">Save Slides</button>
          </div>
        </section>

        <section v-if="roomCode" class="mb-6">
          <h3 class="text-lg font-semibold text-gray-700">Slide Control</h3>
          <div class="mt-2 flex items-center gap-3">
            <div class="text-sm text-gray-600">Current index: <strong class="text-indigo-600">{{ currentIndex }}</strong></div>
            <div class="ml-auto flex items-center gap-2">
              <button @click="prevSlide" class="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">Prev</button>
              <button @click="nextSlide" class="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Next</button>
            </div>
          </div>
        </section>

        <section v-if="aggregates && currentSlideChoices.length" class="mb-6">
          <h3 class="text-lg font-semibold text-indigo-700 mb-3">Live Results</h3>
          <VoteChart :counts="aggregates.counts" :choices="currentSlideChoices" />
        </section>

        <section v-if="roomCode">
          <h3 class="text-lg font-semibold text-pink-600 mb-3">Comments</h3>
          <ul class="space-y-3">
            <li v-for="c in comments" :key="c.id" class="p-3 bg-gray-50 rounded-lg border">
              <div class="flex items-center justify-between">
                <small class="text-xs text-gray-500">{{ new Date(c.createdAt).toLocaleTimeString() }}</small>
              </div>
              <div class="mt-2">
                <em v-if="c.deleted" class="text-gray-400">(削除済み)</em>
                <span v-else class="text-gray-800">{{ c.text }}</span>
              </div>
              <div class="mt-3 flex items-center gap-3">
                <button @click="onLikeComment(c.id)" :disabled="c.deleted" class="text-sm px-3 py-1 rounded-full border hover:bg-indigo-50">
                  <span class="mr-2">{{ (c.userLikes && c.userLikes[myAnonId]) ? '💙' : '👍' }}</span>
                  <span class="text-sm text-gray-700">{{ c.likes || 0 }}</span>
                </button>
                <button v-if="!c.deleted && c.anonId === myAnonId" @click="onDeleteComment(c.id)" class="text-sm text-red-500 hover:underline">Delete</button>
              </div>
            </li>
          </ul>
        </section>

        <pre class="mt-6 text-xs text-gray-400">{{ log }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch, onUnmounted } from 'vue';
import useRoom from '~/composables/useRoom';
import VoteChart from '~/components/VoteChart.vue';
import createDbListener from '~/composables/useDbListener';
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

const slides = reactive<Array<{ title: string; choicesText: string }>>([
  { title: '好きな色は？', choicesText: '赤,青,緑' },
]);
const aggregates = ref<Aggregate | null>(null);
const currentSlideChoices = ref<Choice[]>([]);
const comments = ref<UIComment[]>([]);
let unsubComments: (() => void) | null = null;
const myAnonId = ref<string | null>(null);
// リスナーのクリーンアップ用ハンドル
let unsubSlideIndex: (() => void) | null = null;
let unsubAggregates: (() => void) | null = null;
let unsubSlideContent: (() => void) | null = null;

const ensureR = () => {
  if (!r) r = useRoom();
  return r;
};

const addSlide = () => { slides.push({ title: '', choicesText: '' }); };
const removeSlide = (i: number) => { slides.splice(i, 1); };

const onCreateRoom = async () => {
  try {
    ensureR();
    console.debug('onCreateRoom: calling createRoom');
    const code = await (r as any).createRoom();
    roomCode.value = code;
    log.value = `created ${code}`;
  } catch (e: any) { log.value = `create error: ${e.message}`; }
};

const onSaveSlides = async () => {
  if (!roomCode.value) { log.value = 'no room'; return; }
  const payload = slides.map((s: { title: string; choicesText: string }) => ({ title: s.title || 'untitled', choices: s.choicesText.split(',').map((c: string) => c.trim()).filter(Boolean) }));
  try {
  ensureR();
  console.debug('onSaveSlides: saving slides', payload);
  await (r as any).saveSlides(roomCode.value, payload);
  log.value = 'saved slides';
  } catch (e: any) { log.value = `save error: ${e.message}`; }
};

const setIdx = async (idx: number) => {
  if (!roomCode.value) return;
  try {
  ensureR();
  console.debug('setIdx:', idx);
  await (r as any).setSlideIndex(roomCode.value, idx);
    currentIndex.value = idx;
  } catch (e: any) { log.value = `set index error: ${e.message}`; }
};

onMounted(() => {
  ensureR();
  try { myAnonId.value = (r as any).getAnonId(); } catch (e) { myAnonId.value = null; }
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
  if (unsubSlideIndex) { unsubSlideIndex(); unsubSlideIndex = null; }
  unsubSlideIndex = createDbListener(db, `rooms/${val}/slideIndex`, (snap: any) => {
    if (!snap) return;
    const idx = snap.val();
    currentIndex.value = typeof idx === 'number' ? idx : 0;

  // スライド内容のリスナー
    if (unsubSlideContent) { try { unsubSlideContent(); } catch (e) { /* ignore */ } unsubSlideContent = null; }
      unsubSlideContent = createDbListener(db, `rooms/${val}/slides/slide_${(currentIndex.value || 0) + 1}`, (s: any) => {
        const slideObj = s && s.val ? s.val() as Slide : null;
        if (slideObj && slideObj.choices) {
          currentSlideChoices.value = Object.entries(slideObj.choices).map(([k, v]) => ({ key: k, text: (v as any).text }));
        } else {
          currentSlideChoices.value = [];
        }
      });

  // 集計（aggregates）のリスナー
    if (unsubAggregates) { try { (unsubAggregates as any)(); } catch (e) { /* ignore */ } unsubAggregates = null; }
    unsubAggregates = createDbListener(db, `rooms/${val}/aggregates/slide_${(currentIndex.value || 0) + 1}`, (snap: any) => {
      const a = snap && snap.val ? snap.val() : null;
      aggregates.value = a || { counts: {}, total: 0 };
    });

  // コメント一覧のリスナー
    if (unsubComments) { try { (unsubComments as any)(); } catch (e) { /* ignore */ } unsubComments = null; }
    unsubComments = createDbListener(db, `rooms/${val}/comments`, (snap: any) => {
      const arr: UIComment[] = [];
      snap.forEach((child: any) => {
        arr.unshift({ id: child.key as string, ...(child.val() as CommentType) });
      });
      comments.value = arr;
    });
  });

  // 集計は slideIndex ハンドラ内でスライドごとに登録される

  onUnmounted(() => {
  try { if (unsubSlideIndex) (unsubSlideIndex as any)(); } catch (e) { /* ignore */ }
  try { if (unsubSlideContent) (unsubSlideContent as any)(); } catch (e) { /* ignore */ }
  try { if (unsubAggregates) (unsubAggregates as any)(); } catch (e) { /* ignore */ }
  });
});

const prevSlide = () => { console.debug('prevSlide click'); setIdx(Math.max(0, currentIndex.value - 1)); };
const nextSlide = () => { console.debug('nextSlide click'); setIdx(currentIndex.value + 1); };

const onLikeComment = async (commentId: string) => {
  if (!roomCode.value) return;
  try {
  ensureR();
  console.debug('onLikeComment', commentId);
  await (r as any).likeComment(roomCode.value, commentId);
  } catch (e: any) { log.value = `like error: ${e.message}`; }
};

const onDeleteComment = async (commentId: string) => {
  if (!roomCode.value) return;
  try {
  ensureR();
  console.debug('onDeleteComment', commentId);
  await (r as any).deleteComment(roomCode.value, commentId);
  } catch (e: any) { log.value = `delete error: ${e.message}`; }
};
</script>