<!-- A-02 건물주 연결 (오너측 수신함) -->
<!-- 에이전트가 내 공실에 대해 보낸 대화를 수신·응답. 가정(기반): useChatStore.threads / loadThreads() -->
<!-- thread: { roomId, counterpartName, lastMessage, lastAt, unread } · 룸키 prefix 'vacancy:' 로 공실 대화 필터 -->
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useChatStore } from '@/stores/chat';
import VacancyChat from '@/components/domain/VacancyChat.vue';

const chat = useChatStore();
const activeRoom = ref<string | null>(null);

const threads = computed(() =>
  (chat.threads ?? []).filter((t) => t.roomId.startsWith('vacancy:')),
);
const activeName = computed(
  () => threads.value.find((t) => t.roomId === activeRoom.value)?.counterpartName ?? '에이전트',
);

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : '';

onMounted(() => chat.loadThreads?.());
</script>

<template>
  <section class="page">
    <!-- 스레드 선택 시 채팅, 아니면 목록 -->
    <template v-if="activeRoom">
      <header class="bar">
        <button class="bar__back" type="button" @click="activeRoom = null" aria-label="목록으로">‹</button>
        <h1 class="bar__title">{{ activeName }}</h1>
      </header>
      <div class="page__body">
        <VacancyChat :room-id="activeRoom" />
      </div>
    </template>

    <template v-else>
      <header class="head">
        <p class="eyebrow">공실 문의</p>
        <h1 class="title">에이전트 문의</h1>
      </header>

      <p v-if="threads.length === 0" class="empty">
        <span class="empty__dot" aria-hidden="true" />받은 문의가 없습니다.
      </p>

      <ul v-else class="list">
        <li v-for="t in threads" :key="t.roomId">
          <button class="row" type="button" @click="activeRoom = t.roomId">
            <span class="row__icon" aria-hidden="true" />
            <span class="row__body">
              <span class="row__name">{{ t.counterpartName }}</span>
              <span class="row__last">{{ t.lastMessage }}</span>
            </span>
            <span class="row__trailing">
              <span class="row__time">{{ fmt(t.lastAt) }}</span>
              <span v-if="t.unread" class="row__badge">{{ t.unread }}</span>
            </span>
          </button>
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--paper, #fbfaf6);
}
.head {
  padding: var(--s-6, 20px);
}
.eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brass-ink, #50402a);
  margin: 0 0 var(--s-2, 4px);
}
.title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.012em;
  color: var(--ink, #1e2331);
  margin: 0;
}
.bar {
  height: 56px;
  display: flex;
  align-items: center;
  gap: var(--s-3, 8px);
  padding: 0 var(--s-5, 16px);
  border-bottom: 1px solid var(--slate-100, #eceef1);
}
.bar__back {
  border: 0;
  background: transparent;
  font-size: 24px;
  line-height: 1;
  color: var(--ink, #1e2331);
  width: 44px;
  height: 44px;
  cursor: pointer;
}
.bar__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink, #1e2331);
  margin: 0;
}
.page__body {
  flex: 1;
  min-height: 0;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0 var(--s-6, 20px);
}
.row {
  display: flex;
  align-items: center;
  gap: var(--s-4, 12px);
  width: 100%;
  padding: 14px 0;
  border: 0;
  border-bottom: 1px solid var(--slate-100, #eceef1);
  background: transparent;
  text-align: left;
  cursor: pointer;
  min-height: 44px;
}
.row__icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--paper-sunk, #f4f2ed);
  flex: none;
}
.row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.row__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink, #1e2331);
}
.row__last {
  font-size: 12px;
  color: var(--ink-3, #5e6675);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row__trailing {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.row__time {
  font-size: 11px;
  color: var(--ink-4, #8c939f);
  font-variant-numeric: tabular-nums;
}
.row__badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--ink, #1e2331);
  color: var(--paper, #fbfaf6);
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.empty {
  display: flex;
  align-items: center;
  gap: var(--s-3, 8px);
  padding: var(--s-6, 20px);
  font-size: 15px;
  color: var(--ink-3, #5e6675);
}
.empty__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--brass, #c79a4a);
}
</style>
