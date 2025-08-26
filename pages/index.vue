<template>
  <AppShell>
    <div class="max-w-5xl mx-auto">
      <div class="text-center mb-16 anim-fade-in">
  <h1 class="text-3xl sm:text-5xl font-display font-bold leading-normal lh-normal bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent drop-shadow mb-5 tracking-tight">
          リアルタイム<span class="block sm:inline"> アンケートアプリ</span>
        </h1>
        <p class="text-gray-600 text-sm sm:text-base max-w-2xl mx-auto font-sans">
          ナノすけ & リンカさんと説明会を楽しもう！
        </p>
      </div>

      <div class="space-y-8">
        <!-- Presenter Card -->
        <UiCard variant="glass" padding="lg" interactive>
          <template #header>
            <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 w-full">
              <div class="flex items-baseline gap-2">
                <h2 class="text-primary-600 font-display font-bold text-lg sm:text-xl">発表者</h2>
                <span class="text-[10px] sm:text-xs text-primary-500 tracking-wide">Create / Control</span>
              </div>
            </div>
          </template>
          <div class="space-y-5">
            <p class="text-xs sm:text-sm text-gray-600">ルームを作成して進行開始</p>
            <div class="flex flex-col sm:flex-row gap-3">
              <UiButton class="sm:w-40" variant="primary" size="md" @pressed="createRoom">ルーム作成</UiButton>
              <div class="flex-1 flex items-center gap-2">
                <input v-model="presenterJoinCode" placeholder="または既存コードで入室" class="flex-1 border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/60 rounded-lg px-3 py-2 text-xs sm:text-sm bg-white/70" />
                <UiButton variant="ghost" size="sm" @pressed="enterRoomAsPresenter">入室</UiButton>
              </div>
            </div>
            <div v-if="presenterRoomCode" class="text-[10px] sm:text-xs text-primary-600 font-mono">コード: {{ presenterRoomCode }}</div>
          </div>
        </UiCard>

        <!-- Audience Card -->
        <UiCard variant="glass" padding="lg" interactive>
          <template #header>
            <div class="flex items-baseline gap-2">
              <h2 class="text-secondary-600 font-display font-bold text-lg sm:text-xl">参加者</h2>
              <span class="text-[10px] sm:text-xs text-secondary-500 tracking-wide">Join / Vote</span>
            </div>
          </template>
          <div class="space-y-5">
            <p class="text-xs sm:text-sm text-gray-600">コード入力で即参加・投票・コメント</p>
            <div class="flex flex-col sm:flex-row gap-3">
              <input
                v-model="codeInput"
                placeholder="ルームコードを入力"
                class="flex-1 border border-primary-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-300/60 rounded-lg px-3 py-2 text-sm bg-white/70 backdrop-blur placeholder:text-gray-400"
              />
              <UiButton class="sm:w-32" variant="secondary" size="md" @pressed="joinAsAudience">参加</UiButton>
            </div>
          </div>
        </UiCard>
      </div>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import AppShell from '~/components/ui/AppShell.vue';
import UiButton from '~/components/ui/UiButton.vue';
import { ref } from 'vue';
import useRoom from '~/composables/useRoom';

const codeInput = ref('');
const router = useRouter();
const presenterJoinCode = ref('');
const presenterRoomCode = ref('');
let roomApi: any = null;

const ensureRoom = () => {
  if (!roomApi) roomApi = useRoom();
  return roomApi;
};

const createRoom = async () => {
  try {
    ensureRoom();
    const code = await roomApi.createRoom();
    presenterRoomCode.value = code;
    router.push({ path: '/presenter', query: { code } });
  } catch (e:any) {
    // eslint-disable-next-line no-console
    console.error('createRoom error', e);
  }
};

const enterRoomAsPresenter = async () => {
  const code = presenterJoinCode.value.trim();
  if (!code) return;
  presenterRoomCode.value = code;
  router.push({ path: '/presenter', query: { code } });
};

const joinAsAudience = () => {
  const code = (codeInput.value || '').trim();
  if (!code) return;
  router.push({ path: '/audience', query: { code } });
};
</script>
