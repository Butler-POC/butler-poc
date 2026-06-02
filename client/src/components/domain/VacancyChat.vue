<!-- A-02 공용 채팅 스레드 — 공실 기준 에이전트 ↔ 오너 실시간 대화 -->
<!-- 가정(기반): stores/chat 의 useChatStore = { messages, joinRoom(roomId), leaveRoom(roomId), send(roomId, text) } -->
<!--           messages: { id, roomId, senderId, senderRole, text, createdAt }[] · 소켓 플럼빙은 chat.socket.ts 담당 -->
<!--           stores/auth 의 useAuthStore = { user: { id, role, name } } -->
<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue';
import { useChatStore } from '@/stores/chat';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{ roomId: string; counterpartName?: string }>();

const chat = useChatStore();
const auth = useAuthStore();
const draft = ref('');
const threadEl = ref<HTMLElement | null>(null);

const messages = computed(() => (chat.messages ?? []).filter((m) => m.roomId === props.roomId));
const myId = computed(() => auth.user?.id);

async function scrollToEnd() {
  await nextTick();
  if (threadEl.value) threadEl.value.scrollTop = threadEl.value.scrollHeight;
}

async function send() {
  const text = draft.value.trim();
  if (!text) return;
  draft.value = '';
  await chat.send(props.roomId, text);
  scrollToEnd();
}

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

watch(messages, scrollToEnd);
onMounted(async () => {
  await chat.joinRoom(props.roomId);
  scrollToEnd();
});
onBeforeUnmount(() => chat.leaveRoom?.(props.roomId));
</script>

<template>
  <div class="chat">
    <header v-if="counterpartName" class="chat__head">
      <span class="chat__who">{{ counterpartName }}</span>
    </header>

    <div ref="threadEl" class="chat__thread">
      <p v-if="messages.length === 0" class="chat__empty">
        <span class="chat__dot" aria-hidden="true" />대화를 시작해 보세요.
      </p>
      <div
        v-for="m in messages"
        :key="m.id"
        class="bubble"
        :class="m.senderId === myId ? 'bubble--mine' : 'bubble--theirs'"
      >
        <p class="bubble__text">{{ m.text }}</p>
        <time class="bubble__time">{{ fmtTime(m.createdAt) }}</time>
      </div>
    </div>

    <form class="chat__compose" @submit.prevent="send">
      <input v-model="draft" class="chat__input" placeholder="메시지를 입력하세요" />
      <button class="chat__send" type="submit" :disabled="!draft.trim()">전송</button>
    </form>
  </div>
</template>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--paper, #fbfaf6);
}
.chat__head {
  padding: var(--s-4, 12px) var(--s-6, 20px);
  border-bottom: 1px solid var(--slate-100, #eceef1);
}
.chat__who {
  font-size: 15px;
  font-weight: 600;
  color: var(--ink, #1e2331);
}
.chat__thread {
  flex: 1;
  overflow-y: auto;
  padding: var(--s-6, 20px);
  display: flex;
  flex-direction: column;
  gap: var(--s-3, 8px);
}
.chat__empty {
  display: flex;
  align-items: center;
  gap: var(--s-3, 8px);
  color: var(--ink-3, #5e6675);
  font-size: 15px;
  margin: auto;
}
.chat__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--brass, #c79a4a);
}
.bubble {
  max-width: 78%;
  padding: 10px 12px;
  border-radius: var(--r-card, 12px);
}
.bubble--mine {
  align-self: flex-end;
  background: var(--ink, #1e2331);
  color: var(--paper, #fbfaf6);
}
.bubble--theirs {
  align-self: flex-start;
  background: var(--paper-raised, #ffffff);
  border: 1px solid var(--slate-100, #eceef1);
  color: var(--ink, #1e2331);
}
.bubble__text {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
.bubble__time {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}
.chat__compose {
  display: flex;
  gap: var(--s-3, 8px);
  padding: var(--s-4, 12px) var(--s-6, 20px);
  border-top: 1px solid var(--slate-100, #eceef1);
  background: var(--paper-raised, #ffffff);
}
.chat__input {
  flex: 1;
  padding: 11px 12px;
  min-height: 44px;
  border: 1px solid var(--slate-300, #cacfd8);
  border-radius: var(--r-input, 8px);
  font-size: 15px;
  color: var(--ink, #1e2331);
}
.chat__input:focus {
  outline: none;
  border-color: var(--ink, #1e2331);
  border-width: 1.5px;
}
.chat__send {
  padding: 0 20px;
  min-height: 44px;
  border: 0;
  border-radius: var(--r-pill, 999px);
  background: var(--brass, #c79a4a);
  color: var(--ink, #1e2331);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.chat__send:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
