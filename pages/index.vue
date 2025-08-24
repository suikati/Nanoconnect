<template>
  <div class="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-pink-50 flex items-center justify-center p-6">
    <div class="w-full max-w-2xl bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-8">
      <header class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-extrabold text-indigo-600">リアルタイムアンケートアプリ with ナノすけ&リンカ</h1>
        <p class="text-sm text-gray-500">リアルタイム投票デモ</p>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NuxtLink to="/presenter" class="block">
          <div class="p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-center">
            <div class="text-lg font-semibold text-indigo-700">Presenter</div>
            <div class="text-sm text-indigo-500">スライド作成と進行管理</div>
          </div>
        </NuxtLink>

        <NuxtLink to="/audience" class="block">
          <div class="p-4 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-100 text-center">
            <div class="text-lg font-semibold text-pink-600">Audience</div>
            <div class="text-sm text-pink-500">参加して投票・コメント</div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import useRoom from '~/composables/useRoom';
import createDbListener from '~/composables/useDbListener';
import type { Aggregate } from '~/types/models';

let r: ReturnType<typeof useRoom> | null = null;
const ensureR = () => { if (!r) r = useRoom(); return r; };

const roomCode = ref<string>('');
const joinCode = ref<string>('');
const anonId = ref<string>('');
const joined = ref(false);
const logs = ref<string[]>([]);
const aggregates = ref<Aggregate | null>(null);

const log = (s: string) => { logs.value.unshift(`${new Date().toISOString()} ${s}`); };

const onCreate = async () => {
  try {
    ensureR();
    const code = await (r as any).createRoom();
    roomCode.value = code;
    log(`created ${code}`);
  } catch (e: any) {
    log('create error: ' + e.message);
  }
};

const onJoin = async () => {
  try {
    const code = joinCode.value || roomCode.value;
  ensureR();
  const res = await (r as any).joinRoom(code);
    anonId.value = res.anonId;
    joined.value = true;
    log(`joined ${code} as ${res.anonId}`);
    startListen(code);
  } catch (e: any) {
    log('join error: ' + e.message);
  }
};

const onSaveSlides = async () => {
  if (!roomCode.value && !joinCode.value) { log('no room'); return; }
  const code = roomCode.value || joinCode.value;
  try {
    ensureR();
    await (r as any).saveSlides(code, [{ title: '好きな色は？', choices: ['赤', '青', '緑'] }]);
    log('saved slides');
  } catch (e: any) { log('saveSlides error: ' + e.message); }
};

const onVote = async () => {
  const code = roomCode.value || joinCode.value;
  if (!code) { log('no room'); return; }
  try {
    ensureR();
    await (r as any).submitVote(code, 'slide_1', 'choice_0');
    log('voted slide_1 -> choice_0');
  } catch (e: any) { log('vote error: ' + e.message); }
};

const onComment = async () => {
  const code = roomCode.value || joinCode.value;
  if (!code) { log('no room'); return; }
  try {
    ensureR();
    await (r as any).pushComment(code, 'テストコメントです');
    log('pushed comment');
  } catch (e: any) { log('comment error: ' + e.message); }
};

/* リアルタイム集計の監視（ページ上に表示） */
let unsubscribe: (() => void) | null = null;
const startListen = (code: string) => {
  const nuxt = useNuxtApp();
  const db = nuxt.$firebaseDb;
  // use the centralized listener helper
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  unsubscribe = createDbListener(db, `rooms/${code}/aggregates/slide_1`, (snap: any) => {
    aggregates.value = snap.exists() ? snap.val() : null;
    log('aggregates updated');
  });
};

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

onMounted(() => {
  if (!r) r = useRoom();
});
</script>