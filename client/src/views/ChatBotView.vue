<!-- C-02 챗봇 상담 (공통) — 모든 역할이 쓰는 범용 LLM 챗봇. IssueChat(mode=general) 재사용. -->
<script setup lang="ts">
import IssueChat from '@/components/domain/IssueChat.vue';
import BackHome from '@/components/layout/BackHome.vue';
</script>

<template>
  <section class="page">
    <BackHome />
    <header class="bar">
      <p class="eyebrow">챗봇 상담</p>
      <h1 class="bar__title">무엇이든 물어보세요</h1>
    </header>
    <div class="page__body">
      <IssueChat
        mode="general"
        intro="버틀러 챗봇입니다. 궁금한 점을 입력하세요."
        placeholder="메시지를 입력하세요"
      />
    </div>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--paper, #fbfaf6);
}
.bar {
  padding: var(--s-4, 12px) 0;
}
.eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brass-ink, #50402a);
  margin: 0 0 4px;
}
.bar__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ink, #1e2331);
  margin: 0;
}
.page__body {
  flex: 1;
  min-height: 0;
}
</style>
