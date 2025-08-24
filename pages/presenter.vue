<template>
  <div>
    <h1>Presenter</h1>
    <div>
      <button @click="onCreateRoom">Create Room</button>
      <span v-if="roomCode">Room: {{ roomCode }}</span>
    </div>

    <section style="margin-top:12px;">
      <h3>Slides (max 5)</h3>
      <div v-for="(s, i) in slides" :key="i" style="margin-bottom:8px;">
        <input v-model="s.title" placeholder="Slide title" />
        <input v-model="s.choicesText" placeholder="Choices (comma separated)" />
        <button @click="removeSlide(i)">Remove</button>
      </div>
      <button @click="addSlide" :disabled="slides.length >= 5">Add Slide</button>
      <div style="margin-top:8px;">
        <button @click="onSaveSlides" :disabled="!roomCode">Save Slides</button>
      </div>
    </section>

    <section style="margin-top:16px;" v-if="roomCode">
      <h3>Slide Control</h3>
      <div>Current index: {{ currentIndex }}</div>
      <button @click="prevSlide">Prev</button>
      <button @click="nextSlide">Next</button>
    </section>

    <section v-if="aggregates && currentSlideChoices.length">
      <h3>Live Results</h3>
      <VoteChart :counts="aggregates.counts" :choices="currentSlideChoices" />
    </section>

    <section v-if="roomCode" style="margin-top:16px;">
      <h3>Comments</h3>
      <ul>
        <li v-for="c in comments" :key="c.id" style="margin-bottom:8px;">
          <small>{{ new Date(c.createdAt).toLocaleTimeString() }}</small>
          <div>
            <em v-if="c.deleted">(削除済み)</em>
            <span v-else>{{ c.text }}</span>
          </div>
          <div style="display:flex; gap:8px; margin-top:4px;">
            <button @click="onLikeComment(c.id)" :disabled="c.deleted">{{ (c.userLikes && c.userLikes[myAnonId]) ? '💙' : '👍' }} {{ c.likes || 0 }}</button>
            <button v-if="!c.deleted && c.anonId === myAnonId" @click="onDeleteComment(c.id)">Delete</button>
          </div>
        </li>
      </ul>
    </section>

    <pre style="margin-top:12px;">{{ log }}</pre>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch, onUnmounted } from 'vue';
import useRoom from '~/composables/useRoom';
import VoteChart from '~/components/VoteChart.vue';
import { ref as dbRef, onValue } from 'firebase/database';

let r: ReturnType<typeof useRoom> | null = null;
const roomCode = ref('');
const currentIndex = ref(0);
const log = ref('');

const slides = reactive<Array<{ title: string; choicesText: string }>>([
  { title: '好きな色は？', choicesText: '赤,青,緑' },
]);
const aggregates = ref<any>(null);
const currentSlideChoices = ref<Array<{ key: string; text: string }>>([]);
const comments = ref<Array<any>>([]);
let unsubComments: (() => void) | null = null;
const myAnonId = ref<string | null>(null);
// listener cleanup handles
let unsubSlideIndex: (() => void) | null = null;
let unsubAggregates: (() => void) | null = null;
let unsubSlideContent: (() => void) | null = null;

function addSlide() { slides.push({ title: '', choicesText: '' }); }
function removeSlide(i: number) { slides.splice(i, 1); }

async function onCreateRoom() {
  try {
  if (!r) r = useRoom();
  const code = await r.createRoom();
    roomCode.value = code;
    log.value = `created ${code}`;
  } catch (e: any) { log.value = `create error: ${e.message}`; }
}

async function onSaveSlides() {
  if (!roomCode.value) { log.value = 'no room'; return; }
  const payload = slides.map((s: { title: string; choicesText: string }) => ({ title: s.title || 'untitled', choices: s.choicesText.split(',').map((c: string) => c.trim()).filter(Boolean) }));
  try {
  if (!r) r = useRoom();
  await r.saveSlides(roomCode.value, payload);
    log.value = 'saved slides';
  } catch (e: any) { log.value = `save error: ${e.message}`; }
}

async function setIdx(idx: number) {
  if (!roomCode.value) return;
  try {
    if (!r) r = useRoom();
    await r.setSlideIndex(roomCode.value, idx);
    currentIndex.value = idx;
  } catch (e: any) { log.value = `set index error: ${e.message}`; }
}

onMounted(() => {
  if (!r) r = useRoom();
  try { myAnonId.value = r.getAnonId(); } catch (e) { myAnonId.value = null; }
  // listen to aggregates when room exists
  // (presenter can later add a listener similar to index/audience)
});

// re-use logic similar to audience: when roomCode set, subscribe to slideIndex and slides
watch(roomCode, async (val: string | null) => {
  // cleanup previous
  try {
    if (!r) r = useRoom();
  } catch (e) {
    // nothing
  }
  if (!val) return;

  const nuxt = useNuxtApp();
  const db = (nuxt.$firebaseDb as any) || null;
  if (!db) return;

  // helper to stop a firebase onValue listener
  const registerOnValue = (path: string, cb: (snap: any) => void) => {
    const p = dbRef(db, path);
    const off = onValue(p, cb);
    return () => off();
  };

  // slideIndex listener (register per-slide content listener inside)
  if (unsubSlideIndex) { unsubSlideIndex(); unsubSlideIndex = null; }
  unsubSlideIndex = registerOnValue(`rooms/${val}/slideIndex`, (snap: any) => {
    if (!snap) return;
    const idx = snap.val();
    currentIndex.value = typeof idx === 'number' ? idx : 0;

    // cleanup previous slide content listener
    if (unsubSlideContent) { try { unsubSlideContent(); } catch (e) { /* ignore */ } unsubSlideContent = null; }

    // register slide content listener for this slide
    const slideRefPath = `rooms/${val}/slides/slide_${(currentIndex.value || 0) + 1}`;
    unsubSlideContent = registerOnValue(slideRefPath, (s: any) => {
      const slideObj = s && s.val ? s.val() : null;
      if (slideObj && slideObj.choices) {
        currentSlideChoices.value = Object.entries(slideObj.choices).map(([k, v]: any) => ({ key: k, text: v.text }));
      } else {
        currentSlideChoices.value = [];
      }
    });
    // register aggregates listener for this slide (cleanup previous first)
    if (unsubAggregates) { try { (unsubAggregates as any)(); } catch (e) { /* ignore */ } unsubAggregates = null; }
    const aggRefPath = `rooms/${val}/aggregates/slide_${(currentIndex.value || 0) + 1}`;
    unsubAggregates = registerOnValue(aggRefPath, (snap: any) => {
      const a = snap && snap.val ? snap.val() : null;
      aggregates.value = a || { counts: {}, total: 0 };
    });
    // comments listener for presenter view
    if (unsubComments) { try { (unsubComments as any)(); } catch (e) { /* ignore */ } unsubComments = null; }
    const commentsPath = `rooms/${val}/comments`;
    unsubComments = registerOnValue(commentsPath, (snap: any) => {
      const arr: any[] = [];
      snap.forEach((child: any) => {
        arr.unshift({ id: child.key, ...child.val() });
      });
      comments.value = arr;
    });
  });

  // aggregates will be registered per-slide inside slideIndex handler (below)

  onUnmounted(() => {
  try { if (unsubSlideIndex) (unsubSlideIndex as any)(); } catch (e) { /* ignore */ }
  try { if (unsubSlideContent) (unsubSlideContent as any)(); } catch (e) { /* ignore */ }
  try { if (unsubAggregates) (unsubAggregates as any)(); } catch (e) { /* ignore */ }
  });
});

function prevSlide() { setIdx(Math.max(0, currentIndex.value - 1)); }
function nextSlide() { setIdx(currentIndex.value + 1); }

async function onLikeComment(commentId: string) {
  if (!roomCode.value) return;
  try {
    if (!r) r = useRoom();
    await r.likeComment(roomCode.value, commentId);
  } catch (e: any) { log.value = `like error: ${e.message}`; }
}

async function onDeleteComment(commentId: string) {
  if (!roomCode.value) return;
  try {
    if (!r) r = useRoom();
    await r.deleteComment(roomCode.value, commentId);
  } catch (e: any) { log.value = `delete error: ${e.message}`; }
}
</script>