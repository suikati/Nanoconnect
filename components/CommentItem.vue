<template>
  <li class="p-3 bg-gray-50 rounded-xl border border-gray-100 group anim-fade-in">
    <div class="flex items-center justify-between">
      <small class="text-[10px] uppercase tracking-wide text-gray-400" :title="fullTime">{{ time }}</small>
      <div class="flex items-center gap-2">
        <slot name="meta" />
      </div>
    </div>
    <div class="mt-1 text-sm">
      <em v-if="comment.deleted" class="text-gray-400">(削除済み)</em>
      <span v-else class="text-gray-800 break-words">{{ comment.text }}</span>
    </div>
    <div class="mt-2 flex items-center gap-3 text-xs">
      <button @click="$emit('like', comment.id)" :disabled="comment.deleted" class="px-2 py-1 rounded-full border bg-white hover:bg-indigo-50 transition focus-ring text-gray-600 disabled:opacity-40">
        <span class="mr-1">{{ (comment.userLikes && comment.userLikes[currentAnonId]) ? '💙' : '👍' }}</span>{{ comment.likes || 0 }}
      </button>
      <button v-if="!comment.deleted && comment.anonId === currentAnonId" @click="$emit('delete', comment.id)" class="text-red-500 hover:underline">Delete</button>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Comment } from '~/types/models';
const props = defineProps<{ comment: Comment & { id: string }; currentAnonId: string | null }>();
const time = computed(() => new Date(props.comment.createdAt).toLocaleTimeString());
const fullTime = computed(() => new Date(props.comment.createdAt).toISOString());
</script>
