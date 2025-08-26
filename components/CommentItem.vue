<template>
  <li :class="wrapperClass">
    <div class="flex items-center justify-between">
      <small class="time-chip" :title="fullTime">{{ time }}</small>
      <div class="flex items-center gap-2">
        <slot name="meta" />
      </div>
    </div>
    <div class="mt-1 text-sm leading-relaxed">
      <em v-if="comment.deleted" class="text-gray-400">(削除済み)</em>
      <span v-else class="text-gray-800 break-words">{{ comment.text }}</span>
    </div>
    <div class="mt-2 flex items-center gap-3 text-[11px] sm:text-xs">
      <!-- いいねボタン（多重クリック抑制） -->
      <button
        @click="onLike"
        :disabled="comment.deleted"
        class="like-btn"
  :aria-pressed="comment.userLikes && currentAnonId && comment.userLikes[currentAnonId] ? 'true' : 'false'"
      >
  <span class="mr-1 select-none">{{ comment.userLikes && currentAnonId && comment.userLikes[currentAnonId] ? '💙' : '👍' }}</span>{{ comment.likes || 0 }}
      </button>
  <!-- 削除ボタン（投稿者のみ表示） -->
  <button
        v-if="!comment.deleted && comment.anonId === currentAnonId"
        @click="onDelete"
        class="delete-btn"
      >
        Delete
      </button>
    </div>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Comment } from '~/types/models';
const props = defineProps<{ comment: Comment & { id: string }; currentAnonId: string | null }>();
const time = computed(() => new Date(props.comment.createdAt).toLocaleTimeString());
const fullTime = computed(() => new Date(props.comment.createdAt).toISOString());
const emit = defineEmits<{ (e: 'like', id: string): void; (e: 'delete', id: string): void }>();
const wrapperClass = computed(() => 'p-3 rounded-xl border border-primary-100/60 bg-white/70 glass group anim-fade-in shadow-sm');
let likeLocked = false; // 連打防止ロック
const onLike = (e: Event) => {
  try {
    e.stopImmediatePropagation();
    e.preventDefault();
  } catch (err) {
    /* ignore */
  }
  if (likeLocked || props.comment.deleted) return;
  likeLocked = true; // 一時ロック
  emit('like', props.comment.id);
  setTimeout(() => {
    likeLocked = false;
  }, 350);
};
const onDelete = (e: Event) => {
  try {
    e.stopImmediatePropagation();
    e.preventDefault();
  } catch (err) {
    /* ignore */
  }
  emit('delete', props.comment.id);
};
</script>
