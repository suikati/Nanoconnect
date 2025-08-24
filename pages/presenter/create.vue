<template>
  <div>
    <h1>新しいルームを作成する</h1>
    <button @click="createRoom">ルーム作成</button>
  </div>
</template>

<script setup>
import { signInAnonymously } from "firebase/auth";
import { ref, set } from "firebase/database";

// Nuxtプラグインで提供されたインスタンスを取得
const { $firebaseAuth, $firebaseDb } = useNuxtApp();
const router = useRouter();

// ルームコード生成関数
const generateRoomCode = (length = 6) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// ルーム作成処理
const createRoom = async () => {
  try {
    // 匿名認証を実行
    const userCredential = await signInAnonymously($firebaseAuth);
    const presenterId = userCredential.user.uid;

    // ルームコードを生成
    const roomCode = generateRoomCode();

    // Firebase Realtime Databaseにデータを保存
    const roomRef = ref($firebaseDb, `rooms/${roomCode}`);
    await set(roomRef, {
      presenterId: presenterId,
      currentSlideId: null,
      createdAt: new Date().toISOString()
    });

    // 作成したルームコードでプレゼンターページにリダイレクト
    router.push(`/presenter/${roomCode}`);

  } catch (error) {
    console.error('ルーム作成エラー:', error);
    alert('ルームの作成に失敗しました。');
  }
};
</script>