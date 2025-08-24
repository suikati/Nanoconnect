<template>
  <div>
    <h1>Audience</h1>

    <div>
      <input v-model="codeInput" placeholder="Room code" />
      <button @click="onJoin">Join</button>
      <div v-if="joined">joined as {{ anonId }}</div>
    </div>

    <section v-if="joined && slide">
      <h3>Slide {{ slideNumber }}: {{ slide.title }}</h3>
      <div v-if="aggregates">
        <VoteChart :counts="aggregates.counts || {}" :choices="choicesArray" />
      </div>
      <ul>
        <li v-for="(c, idx) in choicesArray" :key="idx">
          <button @click="onVote(c.key)" :disabled="voted || voting">{{ c.text }} ({{ counts[c.key] ?? 0 }})</button>
        </li>
      </ul>
      <div v-if="voted">You voted: {{ myVote }}</div>
    </section>

    <pre style="margin-top:12px;">{{ log.join('\n') }}</pre>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted, onMounted } from 'vue';
import useRoom from '~/composables/useRoom';
import { ref as dbRef, onValue } from 'firebase/database';
import VoteChart from '~/components/VoteChart.vue';

let r: ReturnType<typeof useRoom> | null = null;
const codeInput = ref('');
const joined = ref(false);
const anonId = ref('');
const slide = ref<any>(null);
const slideNumber = ref<number>(0);
const choicesArray = ref<Array<{ key: string; text: string }>>([]);
const counts = reactive<Record<string, number>>({});
const myVote = ref<string | null>(null);
const voted = ref(false);
const voting = ref(false);
const log = ref<string[]>([]);
const aggregates = ref<any>(null);
let unsubSlide: any = null;
let unsubAgg: any = null;
let unsubVotes: any = null;

function pushLog(s: string) { log.value.unshift(`${new Date().toISOString()} ${s}`); }

async function onJoin() {
  try {
    const code = codeInput.value;
    if (!r) r = useRoom();
    const res = await r.joinRoom(code);
    anonId.value = res.anonId;
    joined.value = true;
    pushLog(`joined ${code} as ${anonId.value}`);
    startListeners(code);
  } catch (e: any) {
    pushLog('join error: ' + e.message);
  }
}

onMounted(() => {
  // initialize client-only composable
  if (!r) r = useRoom();
});

function startListeners(code: string) {
  const nuxt = useNuxtApp();
  const db = nuxt.$firebaseDb;
  // slideIndex listener
  const slideIndexRef = dbRef(db, `rooms/${code}/slideIndex`);
  unsubSlide = onValue(slideIndexRef, async (snap: any) => {
    const idx = snap.exists() ? snap.val() : 0;
    slideNumber.value = idx + 1;
    // fetch slide content
    const slideRef = dbRef(db, `rooms/${code}/slides/slide_${idx + 1}`);
    onValue(slideRef, (s: any) => {
      slide.value = s.exists() ? s.val() : null;
      if (slide.value && slide.value.choices) {
        choicesArray.value = Object.entries(slide.value.choices).map(([k, v]: any) => ({ key: k, text: v.text }));
      } else {
        choicesArray.value = [];
      }
    });
    // Rebind aggregates/myVote listeners for the new slide
    // cleanup previous listeners first
    try {
      if (unsubAgg) { unsubAgg(); unsubAgg = null; }
    } catch (e) { /* ignore */ }
    try {
      if (unsubVotes) { unsubVotes(); unsubVotes = null; }
    } catch (e) { /* ignore */ }

    // aggregates for this slide
    const aggRefSlide = dbRef(db, `rooms/${code}/aggregates/slide_${idx + 1}`);
    unsubAgg = onValue(aggRefSlide, (snapAgg: any) => {
      const aggVal = snapAgg.exists() ? snapAgg.val() : { counts: {} };
      aggregates.value = aggVal;
      // update counts reactive
      const aggCounts = aggVal.counts || {};
      Object.keys(counts).forEach(k => delete counts[k]);
      Object.entries(aggCounts).forEach(([k, v]) => { counts[k] = v as number; });
    });

    // my vote for this slide
    const myVoteRefSlide = dbRef(db, `rooms/${code}/votes/slide_${idx + 1}/${anonId.value}`);
    unsubVotes = onValue(myVoteRefSlide, (s: any) => {
      if (s.exists()) {
        myVote.value = s.val().choiceId;
        voted.value = true;
      } else {
        myVote.value = null;
        voted.value = false;
      }
    });
  });

  // (aggregates/myVote listeners are registered per-slide inside slideIndex listener)
}

async function onVote(choiceKey: string) {
  const code = codeInput.value;
  try {
  if (!r) r = useRoom();
  voting.value = true;
  await r.submitVoteSafe(code, `slide_${slideNumber.value}`, choiceKey);
  pushLog(`voted ${choiceKey}`);
  voted.value = true;
  myVote.value = choiceKey;
  voting.value = false;
  } catch (e: any) { pushLog('vote error: ' + e.message); }
}

onUnmounted(() => {
  if (unsubSlide) unsubSlide();
  if (unsubAgg) unsubAgg();
  if (unsubVotes) unsubVotes();
});
</script>