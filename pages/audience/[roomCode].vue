<template>
  <div>
    <h1 v-if="currentSlide">{{ currentSlide.title }}</h1>
    <div v-if="currentSlide">
      <div v-for="(option, index) in currentSlide.options" :key="index">
        <button>{{ option }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getDatabase, ref as dbRef, onValue } from 'firebase/database';
import { useRoute } from 'vue-router';

const route = useRoute();
const roomCode = route.params.roomCode;
const db = getDatabase();

const allSlides = ref([]);
const currentSlideId = ref(null);

const currentSlide = computed(() => {
  if (!allSlides.value || !currentSlideId.value) return null;
  return allSlides.value.find(s => s.slideId === currentSlideId.value);
});

onMounted(() => {
  // すべてのスライドデータを読み込む
  const slidesRef = dbRef(db, `slides/${roomCode}`);
  onValue(slidesRef, (snapshot) => {
    if (snapshot.exists()) {
      allSlides.value = Object.values(snapshot.val());
    }
  });

  // 現在表示中のスライドIDを監視
  const currentSlideRef = dbRef(db, `rooms/${roomCode}/currentSlideId`);
  onValue(currentSlideRef, (snapshot) => {
    if (snapshot.exists()) {
      currentSlideId.value = snapshot.val();
    }
  });
});
</script>