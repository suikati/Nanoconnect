<template>
  <div>
    <h1>ルームに参加</h1>
    <input v-model="roomCode" placeholder="ルームコードを入力" />
    <button @click="joinRoom">参加する</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { useRouter } from 'vue-router';
import { useNuxtApp } from '#imports';

const roomCode = ref('');
const { $firebaseAuth, $firebaseDb } = useNuxtApp();
const router = useRouter();

const joinRoom = async () => {
  if (!roomCode.value) {
    alert('ルームコードを入力してください。');
    return;
  }

  try {
    // 1. ルームコードの存在確認
    const roomSnapshot = await get(dbRef($firebaseDb, `rooms/${roomCode.value}`));
    if (!roomSnapshot.exists()) {
      alert('そのルームコードは存在しません。');
      return;
    }

    // 2. 匿名認証を実行
    await signInAnonymously($firebaseAuth);

    // 3. 認証と存在確認が成功したらリダイレクト
    router.push(`/audience/${roomCode.value}`);
  } catch (error) {
    console.error('参加エラー:', error);
    alert('ルームへの参加に失敗しました。');
  }
};
</script>