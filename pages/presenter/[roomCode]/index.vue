<template>
  <div>
    <h1>アンケート/クイズ作成</h1>
    <div v-for="(slide, index) in slides" :key="index">
      <h2>スライド {{ index + 1 }}</h2>
      <input v-model="slide.title" placeholder="スライドのタイトル" />
      <div v-for="(option, optionIndex) in slide.options" :key="optionIndex">
        <input v-model="slide.options[optionIndex]" placeholder="選択肢" />
      </div>
      <button @click="addOption(index)">選択肢を追加</button>
    </div>
    <button @click="addSlide">スライドを追加</button>
    <button @click="saveSlides">アンケートを保存</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getDatabase, ref as dbRef, set } from "firebase/database";
import { nanoid } from 'nanoid';
import { useRoute, useRouter } from 'vue-router';

// Nuxtプラグインで提供されたインスタンスを取得
const { $firebaseDb } = useNuxtApp();
const router = useRouter();
const route = useRoute();
const roomCode = ref(null); // roomCodeをリアクティブなrefとして定義

// コンポーネントがマウントされた後にroomCodeを取得
onMounted(() => {
  roomCode.value = route.params.roomCode;
});

const slides = ref([
  { title: '', options: ['', ''] }
]);

const addOption = (slideIndex) => {
  slides.value[slideIndex].options.push('');
};

const addSlide = () => {
  if (slides.value.length < 5) {
    slides.value.push({ title: '', options: ['', ''] });
  } else {
    alert('スライドは最大5つまでです。');
  }
};

const saveSlides = async () => {
  if (!roomCode.value) {
    alert('ルームコードが見つかりません。');
    return;
  }

  try {
    const slidesData = {};
    slides.value.forEach((slide, index) => {
      const slideId = nanoid();
      slidesData[slideId] = {
        title: slide.title,
        options: slide.options.filter(option => option !== ''),
        slideNumber: index + 1
      };
    });

    // パスにroomCode.valueを使用
    const slidesRef = dbRef($firebaseDb, `slides/${roomCode.value}`);
    await set(slidesRef, slidesData);

    alert('アンケートが保存されました！');
    router.push(`/presenter/${roomCode.value}/control`);

  } catch (error) {
    console.error('スライド保存エラー:', error);
    alert('スライドの保存に失敗しました。' + error.message);
  }
};
</script>