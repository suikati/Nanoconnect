<template>
  <div>
    <h1>Hello, Vue!</h1>
  </div>
</template>

<script setup>
const { $supabase } = useNuxtApp()
console.log($supabase)
// ターミナルまたはブラウザのコンソールにクライアントインスタンスが表示されれば成功
</script>

<style scoped>
/* Your component-specific styles here */
h1 {
  color: #333;
}
</style>