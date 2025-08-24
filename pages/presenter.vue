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
// listener cleanup handles
let unsubSlideIndex: (() => void) | null = null;
let unsubSlides: (() => void) | null = null;
let unsubAggregates: (() => void) | null = null;

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

  // slideIndex listener
  if (unsubSlideIndex) { unsubSlideIndex(); unsubSlideIndex = null; }
  unsubSlideIndex = registerOnValue(`rooms/${val}/slideIndex`, (snap: any) => {
    if (!snap) return;
    const idx = snap.val();
    currentIndex.value = typeof idx === 'number' ? idx : 0;
  });

  // slides listener
  if (unsubSlides) { unsubSlides(); unsubSlides = null; }
  unsubSlides = registerOnValue(`rooms/${val}/slides`, (snap: any) => {
    const s = snap && snap.val ? snap.val() : null;
    if (!s) { currentSlideChoices.value = []; return; }
    const slideKey = `slide_${currentIndex.value + 1}`;
    const slide = s[slideKey];
    if (!slide) { currentSlideChoices.value = []; return; }
    const choices = Object.entries(slide.choices || {}).map(([k, v]: any) => ({ key: k, text: v.text }));
    currentSlideChoices.value = choices;
  });

  // aggregates listener for current slide
  const ensureAggregatesListener = () => {
    if (unsubAggregates) { unsubAggregates(); unsubAggregates = null; }
    const slideKey = `slide_${currentIndex.value + 1}`;
    unsubAggregates = registerOnValue(`rooms/${val}/aggregates/${slideKey}`, (snap: any) => {
      const a = snap && snap.val ? snap.val() : null;
      aggregates.value = a || { counts: {}, total: 0 };
    });
  };

  // set up watch on currentIndex to re-register aggregates listener
  watch(currentIndex, () => {
    ensureAggregatesListener();
  });

  onUnmounted(() => {
    try { if (unsubSlideIndex) unsubSlideIndex(); } catch (e) { /* ignore */ }
    try { if (unsubSlides) unsubSlides(); } catch (e) { /* ignore */ }
    try { if (unsubAggregates) unsubAggregates(); } catch (e) { /* ignore */ }
  });

  // initial aggregates listener
  ensureAggregatesListener();
});

function prevSlide() { setIdx(Math.max(0, currentIndex.value - 1)); }
function nextSlide() { setIdx(currentIndex.value + 1); }
</script>