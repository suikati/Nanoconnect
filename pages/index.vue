<template>
  <AppShell>
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-16 anim-fade-in">
        <h1 class="text-3xl sm:text-5xl font-display font-bold leading-tight text-gradient mb-5 tracking-tight">
          リアルタイム<span class="block sm:inline"> アンケートアプリ</span>
        </h1>
        <p class="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto font-sans">
          ナノすけ & リンカさんと説明会を楽しもう！
        </p>
      </div>
      <div class="grid gap-6 sm:gap-8 sm:grid-cols-2">
        <NuxtLink to="/presenter" class="group block focus-ring rounded-2xl">
          <div class="h-full bg-white/80 glass rounded-2xl p-6 border border-primary-100 shadow-md hocus:shadow-pop transition relative overflow-hidden">
            <span class="absolute inset-0 opacity-0 group-hover:opacity-15 bg-gradient-to-tr from-primary-500/60 to-secondary-500/60 transition pointer-events-none" />
            <h2 class="text-lg sm:text-xl font-bold text-primary-600 mb-1 font-display">発表者</h2>
            <p class="text-xs sm:text-sm text-gray-600">アンケートを作成して、リアルタイムで進行・集計</p>
          </div>
        </NuxtLink>
        <div class="group block rounded-2xl">
          <div class="h-full bg-white/80 glass rounded-2xl p-6 border border-secondary-100 shadow-md hocus:shadow-pop transition relative overflow-hidden">
            <h2 class="text-lg sm:text-xl font-bold text-secondary-600 mb-1 font-display">参加者</h2>
            <p class="text-xs sm:text-sm text-gray-600">コード入力で即参加・投票・コメント</p>
            <div class="mt-4 flex gap-2">
              <input
                v-model="codeInput"
                placeholder="ルームコードを入力"
                class="flex-1 border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/60 rounded-lg px-3 py-2 text-sm bg-white/70 backdrop-blur placeholder:text-gray-400"
              />
              <UiButton variant="secondary" size="md" @pressed="joinAsAudience">参加</UiButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '~/components/ui/AppShell.vue';
import UiButton from '~/components/ui/UiButton.vue';
import { ref } from 'vue';

const codeInput = ref('');
const router = useRouter();

const joinAsAudience = () => {
  const code = (codeInput.value || '').trim();
  if (!code) return;
  router.push({ path: '/audience', query: { code } });
};
</script>
