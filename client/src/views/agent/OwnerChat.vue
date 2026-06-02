<!-- A-02 건물주 연결 (에이전트측) -->
<!-- 특정 공실에 대해 소유권자(임대인)와 실시간 채팅. 채팅방 키 = vacancy:{vacancyId}:agent:{agentId} -->
<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { vacancyRoomId } from '@/api/vacancies';
import VacancyChat from '@/components/domain/VacancyChat.vue';

const route = useRoute();
const auth = useAuthStore();

const vacancyId = computed(() => String(route.params.vacancyId));
const roomId = computed(() => vacancyRoomId(vacancyId.value, auth.user?.id ?? ''));
</script>

<template>
  <section class="chat-page">
    <header class="bar">
      <h1 class="bar__title">임대인 연결</h1>
    </header>
    <div class="chat-page__body">
      <VacancyChat :room-id="roomId" counterpart-name="임대인" />
    </div>
  </section>
</template>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--paper, #fbfaf6);
}
.bar {
  height: 56px;
  display: flex;
  align-items: center;
  padding: 0 var(--s-6, 20px);
  border-bottom: 1px solid var(--slate-100, #eceef1);
}
.bar__title {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink, #1e2331);
  margin: 0;
}
.chat-page__body {
  flex: 1;
  min-height: 0;
}
</style>
