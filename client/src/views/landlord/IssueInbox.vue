<!-- T-03 하자 수신함 (버틀러 오너) -->
<!-- 임차인이 제보한 하자를 수신·확인. 임대인 연락 필요 건은 상단·강조. 소켓 'issue:reported' 로 실시간 갱신. -->
<!-- 가정(기반): useChatStore.on/off(소켓 이벤트 구독) — 미지원이어도 onMounted 로 1회 로드됨 -->
<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';
import { useIssuesStore } from '@/stores/issues';
import { useChatStore } from '@/stores/chat';
import type { IssueCategory } from '@/types';
import BaseCard from '@/components/ui/BaseCard.vue';
import BackHome from '@/components/layout/BackHome.vue';

const issues = useIssuesStore();
const chat = useChatStore();

const CATEGORY_LABEL: Record<IssueCategory, string> = {
  plumbing: '수도/하수',
  electrical: '전기',
  boiler: '보일러/난방',
  waterproof: '누수/방수',
  interior: '내부 마감',
  appliance: '빌트인 가전',
  other: '기타',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

const onIncoming = () => issues.loadInbox();

onMounted(() => {
  issues.loadInbox();
  chat.on?.('issue:reported', onIncoming);
});
onBeforeUnmount(() => chat.off?.('issue:reported', onIncoming));
</script>

<template>
  <section class="page">
    <BackHome />
    <header class="head">
      <p class="eyebrow">하자 수신함</p>
      <h1 class="title">접수된 하자</h1>
    </header>

    <p v-if="issues.error" class="error">{{ issues.error }}</p>

    <p v-else-if="!issues.loading && issues.inbox.length === 0" class="empty">
      <span class="empty__dot" aria-hidden="true" />접수된 하자가 없습니다.
    </p>

    <ul v-else class="list">
      <li v-for="it in issues.inbox" :key="it.id">
        <BaseCard>
          <article class="issue" :class="{ 'issue--need': it.aiNeedsLandlord }">
            <div class="issue__head">
              <span class="cat">{{ CATEGORY_LABEL[it.category] }}</span>
              <span
                class="status"
                :class="it.aiNeedsLandlord ? 'status--need' : 'status--ok'"
              >
                <span class="status__dot" aria-hidden="true" />
                {{ it.aiNeedsLandlord ? '연락 필요' : '확인 요망' }}
              </span>
            </div>
            <p v-if="it.buildingAddress" class="issue__addr">{{ it.buildingAddress }}</p>
            <p class="issue__desc">{{ it.description }}</p>
            <div class="issue__foot">
              <span class="issue__rate num">제안 수선비율 {{ it.proposedRepairRate }}%</span>
              <time class="issue__date num">{{ fmtDate(it.createdAt) }}</time>
            </div>
          </article>
        </BaseCard>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.page {
  padding: var(--s-6, 20px);
  display: flex;
  flex-direction: column;
  gap: var(--s-5, 16px);
  background: var(--paper, #fbfaf6);
  min-height: 100%;
}
.eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brass-ink, #50402a);
  margin: 0 0 4px;
}
.title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.012em;
  color: var(--ink, #1e2331);
  margin: 0;
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-4, 12px);
}
.issue--need {
  position: relative;
}
.issue--need::before {
  content: '';
  position: absolute;
  left: -18px;
  top: 2px;
  bottom: 2px;
  width: 3px;
  border-radius: 999px;
  background: var(--brass, #c79a4a);
}
.issue__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3, 8px);
}
.cat {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink, #1e2331);
}
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--r-pill, 999px);
  font-size: 11px;
  font-weight: 600;
}
.status--need {
  background: var(--amber-soft, #f3e9cf);
  color: var(--brass-ink, #50402a);
}
.status--ok {
  background: var(--paper-sunk, #f4f2ed);
  color: var(--ink-3, #5e6675);
}
.status__dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
}
.issue__addr {
  font-size: 12px;
  color: var(--ink-3, #5e6675);
  margin: 6px 0 0;
}
.issue__desc {
  font-size: 14px;
  line-height: 1.55;
  color: var(--ink-2, #3a4151);
  margin: 8px 0 0;
}
.issue__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: var(--s-4, 12px);
  padding-top: var(--s-3, 8px);
  border-top: 1px solid var(--slate-100, #eceef1);
}
.issue__rate {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink, #1e2331);
}
.issue__date {
  font-size: 11px;
  color: var(--ink-4, #8c939f);
}
.num {
  font-variant-numeric: tabular-nums;
}
.empty {
  display: flex;
  align-items: center;
  gap: var(--s-3, 8px);
  font-size: 15px;
  color: var(--ink-3, #5e6675);
}
.empty__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--brass, #c79a4a);
}
.error {
  font-size: 13px;
  color: var(--crimson, #b5443c);
}
</style>
