<template>
  <div class="min-h-screen flex flex-col relative">
    <div class="pointer-events-none absolute inset-0 opacity-60 select-none">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,#c7d2fe_0,#fff_30%)] mix-blend-multiply" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_85%_70%,#fbcfe8_0,#fff_35%)] mix-blend-multiply" />
    </div>
    <header class="px-4 sm:px-8 py-4 flex items-center gap-4 relative z-10">
      <NuxtLink
        to="/"
        class="text-lg sm:text-xl font-display font-bold brand-gradient"
        aria-label="ホームに戻る"
      >NanoPoll</NuxtLink>
      <div class="ml-auto flex items-center gap-2 text-[10px] sm:text-xs text-gray-500">
        <slot name="header-extra" />
      </div>
    </header>
    <main class="flex-1 px-4 sm:px-8 pb-12 relative z-10">
      <slot />
    </main>
    <footer class="px-6 py-6 text-center text-[10px] sm:text-xs text-gray-400 relative z-10">&copy; 2025 NanoPoll</footer>
  </div>
</template>

<script setup lang="ts">
// シェルのみ
</script>
