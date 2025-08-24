<template>
  <div class="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-pink-50">
    <header class="px-4 sm:px-6 py-4 flex items-center gap-4">
      <NuxtLink to="/" class="text-xl font-extrabold text-gradient" aria-label="ホームに戻る"
        >NanoPoll</NuxtLink
      >
      <div class="ml-auto flex items-center gap-2 text-xs text-gray-500">
        <slot name="header-extra" />
      </div>
    </header>
    <main class="flex-1 px-4 sm:px-6 pb-10">
      <slot />
    </main>
    <footer class="px-6 py-4 text-center text-xs text-gray-400">&copy; 2025 NanoPoll</footer>
  </div>
</template>

<script setup lang="ts">
// シェルのみ
</script>
