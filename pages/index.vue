<template>
  <AppShell>
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-14">
        <h1 class="text-4xl sm:text-5xl font-extrabold leading-tight text-gradient mb-4">リアルタイム投票で<span class="block sm:inline">盛り上がろう</span></h1>
        <p class="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto">Mentimeter ライクなスピード感と、ナノすけ & リンカ の世界観。超シンプル & ポップな UI で投票・コメントをその場で。</p>
      </div>
      <div class="grid gap-6 sm:grid-cols-2">
        <NuxtLink to="/presenter" class="group block">
          <div class="h-full bg-white rounded-2xl p-6 border border-indigo-100 shadow-md hover:shadow-pop transition relative overflow-hidden">
            <span class="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-tr from-indigo-500 to-pink-500 transition" />
            <h2 class="text-xl font-bold text-indigo-600 mb-1">Presenter</h2>
            <p class="text-sm text-gray-500">スライドを作成しリアルタイムで進行・集計</p>
          </div>
        </NuxtLink>
        <NuxtLink to="/audience" class="group block">
          <div class="h-full bg-white rounded-2xl p-6 border border-pink-100 shadow-md hover:shadow-pop transition relative overflow-hidden">
            <span class="absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-tr from-pink-500 to-indigo-500 transition" />
            <h2 class="text-xl font-bold text-pink-600 mb-1">Audience</h2>
            <p class="text-sm text-gray-500">コード入力で即参加・投票・コメント</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '~/components/ui/AppShell.vue';
</script>