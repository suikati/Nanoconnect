<template>
  <div style="padding:16px">
    <h1>Nanosuke Linka</h1>
    <p>
      <NuxtLink to="/presenter"><button>Presenter</button></NuxtLink>
      <NuxtLink to="/audience" style="margin-left:8px"><button>Audience</button></NuxtLink>
    </p>
    <p style="margin-top:12px;color:#666">開発用: presenter と audience ページへ移動してください。</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import useRoom from '~/composables/useRoom';
import { ref as dbRef, onValue } from 'firebase/database';

let r: ReturnType<typeof useRoom> | null = null;

const roomCode = ref<string>('');
const joinCode = ref<string>('');
const anonId = ref<string>('');
const joined = ref(false);
const logs = ref<string[]>([]);
const aggregates = ref<any>(null);

function log(s: string) { logs.value.unshift(`${new Date().toISOString()} ${s}`); }

async function onCreate() {
  try {
  if (!r) r = useRoom();
  const code = await r.createRoom();
    roomCode.value = code;
    log(`created ${code}`);
  } catch (e: any) {
    log('create error: ' + e.message);
  }
}

async function onJoin() {
  try {
    const code = joinCode.value || roomCode.value;
  if (!r) r = useRoom();
  const res = await r.joinRoom(code);
    anonId.value = res.anonId;
    joined.value = true;
    log(`joined ${code} as ${res.anonId}`);
    startListen(code);
  } catch (e: any) {
    log('join error: ' + e.message);
  }
}

async function onSaveSlides() {
  if (!roomCode.value && !joinCode.value) { log('no room'); return; }
  const code = roomCode.value || joinCode.value;
  try {
  if (!r) r = useRoom();
  await r.saveSlides(code, [{ title: '好きな色は？', choices: ['赤', '青', '緑'] }]);
    log('saved slides');
  } catch (e: any) { log('saveSlides error: ' + e.message); }
}

async function onVote() {
  const code = roomCode.value || joinCode.value;
  if (!code) { log('no room'); return; }
  try {
  if (!r) r = useRoom();
  await r.submitVote(code, 'slide_1', 'choice_0');
    log('voted slide_1 -> choice_0');
  } catch (e: any) { log('vote error: ' + e.message); }
}

async function onComment() {
  const code = roomCode.value || joinCode.value;
  if (!code) { log('no room'); return; }
  try {
    await r.pushComment(code, 'テストコメントです');
    log('pushed comment');
  } catch (e: any) { log('comment error: ' + e.message); }
}

/* リアルタイム集計の監視（ページ上に表示） */
let unsubscribe: (() => void) | null = null;
function startListen(code: string) {
  const nuxt = useNuxtApp();
  const db = nuxt.$firebaseDb;
  const aggRef = dbRef(db, `rooms/${code}/aggregates/slide_1`);
  // onValue を登録
  unsubscribe = onValue(aggRef, (snap) => {
    aggregates.value = snap.exists() ? snap.val() : null;
    log('aggregates updated');
  }) as unknown as () => void;
}

onUnmounted(() => {
  if (unsubscribe) unsubscribe();
});

onMounted(() => {
  if (!r) r = useRoom();
});
</script>