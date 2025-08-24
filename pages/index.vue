<template>
  <div class="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-pink-50 flex items-center justify-center p-6">
    <div class="w-full max-w-2xl bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-8">
      <header class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-extrabold text-indigo-600">リアルタイムアンケートアプリ with ナノすけ&リンカ</h1>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NuxtLink to="/presenter" class="block">
          <div class="p-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-center">
            <div class="text-lg font-semibold text-indigo-700">Presenter</div>
            <div class="text-sm text-indigo-500">スライド作成と進行管理</div>
          </div>
        </NuxtLink>

        <NuxtLink to="/audience" class="block">
          <div class="p-4 rounded-xl bg-pink-50 hover:bg-pink-100 border border-pink-100 text-center">
            <div class="text-lg font-semibold text-pink-600">Audience</div>
            <div class="text-sm text-pink-500">参加して投票・コメント</div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ランディングページはシンプル化：テンプレートのみを保持
</script>