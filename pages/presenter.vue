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

    <pre style="margin-top:12px;">{{ log }}</pre>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import useRoom from '~/composables/useRoom';

const r = useRoom();
const roomCode = ref('');
const currentIndex = ref(0);
const log = ref('');

const slides = reactive<Array<{ title: string; choicesText: string }>>([
  { title: '好きな色は？', choicesText: '赤,青,緑' },
]);

function addSlide() { slides.push({ title: '', choicesText: '' }); }
function removeSlide(i: number) { slides.splice(i, 1); }

async function onCreateRoom() {
  try {
    const code = await r.createRoom();
    roomCode.value = code;
    log.value = `created ${code}`;
  } catch (e: any) { log.value = `create error: ${e.message}`; }
}

async function onSaveSlides() {
  if (!roomCode.value) { log.value = 'no room'; return; }
  const payload = slides.map(s => ({ title: s.title || 'untitled', choices: s.choicesText.split(',').map(c => c.trim()).filter(Boolean) }));
  try {
    await r.saveSlides(roomCode.value, payload);
    log.value = 'saved slides';
  } catch (e: any) { log.value = `save error: ${e.message}`; }
}

async function setIdx(idx: number) {
  if (!roomCode.value) return;
  try {
    await r.setSlideIndex(roomCode.value, idx);
    currentIndex.value = idx;
  } catch (e: any) { log.value = `set index error: ${e.message}`; }
}

function prevSlide() { setIdx(Math.max(0, currentIndex.value - 1)); }
function nextSlide() { setIdx(currentIndex.value + 1); }
</script>