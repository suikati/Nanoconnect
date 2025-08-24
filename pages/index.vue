<template>
  <div>
    <h1>Firebase 接続確認</h1>
  </div>
</template>

// ...existing code...
<script setup lang="ts">
import { onMounted } from "vue";
import { ref as dbRef, push, onValue } from "firebase/database";

const nuxt = useNuxtApp();

onMounted(async () => {
  const db = nuxt.$firebaseDb;
  const app = nuxt.$firebaseApp;
  console.log("firebase app name:", app?.name);
  console.log("firebase db:", db);

  if (!db) {
    console.warn("firebaseDb not available");
    return;
  }

  // 書き込みテスト: /test/ping に timestamp を push
  try {
    await push(dbRef(db, "test/ping"), { ts: new Date().toISOString() });
    console.log("pushed ping");
  } catch (e) {
    console.error("push error:", e);
  }

  // 読み取りテスト: /test/ping を監視
  onValue(dbRef(db, "test/ping"), (snap) => {
    console.log("test/ping value:", snap.val());
  });
});
</script>

<style scoped>
/* Your component-specific styles here */
h1 {
  color: #333;
}
</style>