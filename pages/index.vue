<template>
  <div>
    <h1>Firebase 接続確認</h1>
  </div>
</template>

<script setup>
const { $firebaseDb } = useNuxtApp();

// コンソールにFirebase Realtime Databaseのインスタンスが表示されれば成功
console.log($firebaseDb);
</script>

<style scoped>
/* Your component-specific styles here */
h1 {
  color: #333;
}
</style>