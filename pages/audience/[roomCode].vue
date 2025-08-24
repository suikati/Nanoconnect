<template>
  <div>
    <div v-if="loading">
      <p>プレゼンターの準備を待っています...</p>
    </div>
    <div v-if="currentSlide">
      <h1>{{ currentSlide.title }}</h1>
      <div v-for="(option, index) in currentSlide.options" :key="index">
        <button @click="vote(index)">
          {{ option }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref as dbRef, onValue, set } from 'firebase/database';
import { useRoute } from 'vue-router';
import { useNuxtApp } from '#imports';

const route = useRoute();
const roomCode = route.params.roomCode;

const { $firebaseApp, $firebaseDb } = useNuxtApp();
const auth = getAuth($firebaseApp);

const loading = ref(true);
const allSlides = ref([]);
const currentSlideId = ref(null);

const currentSlide = computed(() => {
  if (!allSlides.value || !currentSlideId.value) return null;
  return allSlides.value.find(s => s.slideId === currentSlideId.value);
});

onMounted(() => {
  // すべてのスライドデータを読み込む（リアルタイム）
  onValue(dbRef($firebaseDb, `slides/${roomCode}`), (snapshot) => {
    if (snapshot.exists()) {
      allSlides.value = Object.values(snapshot.val());
    }
  });

  // 現在表示中のスライドIDを監視
  onValue(dbRef($firebaseDb, `rooms/${roomCode}/currentSlideId`), (snapshot) => {
    currentSlideId.value = snapshot.val();
    loading.value = false;
  });
});

const vote = async (optionIndex) => {
  if (!currentSlide.value) return;

  try {
    const user = auth.currentUser;
    const uid = user.uid;
    const slideId = currentSlide.value.slideId;

    // 投票データをデータベースに保存
    const voteRef = dbRef($firebaseDb, `votes/${roomCode}/${slideId}/${uid}`);
    await set(voteRef, {
      optionIndex: optionIndex,
      votedAt: new Date().toISOString()
    });

    alert('投票が完了しました！');

  } catch (error) {
    console.error('投票エラー:', error);
    alert('投票に失敗しました。');
  }
};
</script>