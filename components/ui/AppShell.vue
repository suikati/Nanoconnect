<template>
  <!-- retro クラスで全体をレトロテーマ化 -->
  <div class="retro min-h-screen flex flex-col retro-main-bg">
    <header class="px-4 sm:px-6 py-4 flex items-center gap-4">
      <NuxtLink to="/" class="pixel-title text-base sm:text-xl" aria-label="ホームに戻る">
        NANO<span class="text-[var(--retro-accent)]">POLL</span>
      </NuxtLink>
      <div class="ml-auto flex items-center gap-3 text-[10px] sm:text-xs tracking-wide font-[600] opacity-70">
        <slot name="header-extra" />
      </div>
    </header>
    <main class="flex-1 px-3 sm:px-6 pb-10">
      <slot />
    </main>
    <footer class="px-4 sm:px-6 py-4 text-center text-[10px] sm:text-xs text-gray-400">© 2025 NanoPoll</footer>
  </div>
</template>

<script setup lang="ts">
// シェルのみ / retro theme wrapper
</script>
