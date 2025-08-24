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
import { ref } from 'vue';
import { getDatabase, set } from "firebase/database";
import { nanoid } from 'nanoid';

const { $firebaseDb } = useNuxtApp();
const router = useRouter();
const route = useRoute();
const roomCode = route.params.roomCode;

const slides = ref([
  { title: '', options: ['', ''] } // 初期スライド
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
  try {
    const slidesData = {};
    slides.value.forEach((slide, index) => {
      const slideId = nanoid(); // ユニークなスライドIDを生成
      slidesData[slideId] = {
        title: slide.title,
        options: slide.options.filter(option => option !== ''), // 空の選択肢を削除
        slideNumber: index + 1
      };
    });

    const slidesRef = ref($firebaseDb, `slides/${roomCode}`);
    await set(slidesRef, slidesData);

    alert('アンケートが保存されました！');
    // 次のステップ（スライド開始画面）へリダイレクト
    router.push(`/presenter/${roomCode}/control`);

  } catch (error) {
    console.error('スライド保存エラー:', error);
    // ここに error.message を追加
    alert('スライドの保存に失敗しました: ' + error.message);
  }
};
</script>