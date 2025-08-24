<template>
  <AppShell>
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-14">
        <h1 class="text-4xl sm:text-5xl font-extrabold leading-tight text-gradient mb-4">リアルタイム<span class="block sm:inline">アンケートアプリ</span></h1>
        <p class="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">ナノすけ&リンカさんと説明会を楽しもう</p>
      </div>
      <div class="grid gap-6 sm:grid-cols-2">
        <NuxtLink to="/presenter" class="group block">
          <div class="h-full bg-white rounded-2xl p-6 border border-indigo-100 shadow-md hover:shadow-pop transition relative overflow-hidden">
            <!-- hover gradient removed -->
            <h2 class="text-xl font-bold text-indigo-600 mb-1">発表者</h2>
            <p class="text-sm text-gray-500">アンケートを作成して、リアルタイムで進行・集計</p>
          </div>
        </NuxtLink>
        <div class="group block">
          <div class="h-full bg-white rounded-2xl p-6 border border-pink-100 shadow-md hover:shadow-pop transition relative overflow-hidden">
            <!-- hover gradient removed -->
            <h2 class="text-xl font-bold text-pink-600 mb-1">参加者</h2>
            <p class="text-sm text-gray-500">コード入力で即参加・投票・コメント</p>
            <div class="mt-4 flex gap-2">
              <input v-model="codeInput" placeholder="ルームコードを入力" class="flex-1 border rounded-lg px-3 py-2" />
              <button @click="joinAsAudience" class="bg-pink-500 text-white px-4 py-2 rounded-lg">参加</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '~/components/ui/AppShell.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const codeInput = ref('');
const router = useRouter();

const joinAsAudience = () => {
  const code = (codeInput.value || '').trim();
  if (!code) return;
  router.push({ path: '/audience', query: { code } });
};
</script>