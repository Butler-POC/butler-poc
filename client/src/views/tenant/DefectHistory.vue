<!-- T-03 하자 제보 이력 (테넌트) -->
<!-- 본인이 제보한 하자 내역 아카이브. -->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useIssuesStore } from '@/stores/issues';
import type { IssueCategory, IssueStatus } from '@/types';
import BaseCard from '@/components/ui/BaseCard.vue';

const issues = useIssuesStore();

const CATEGORY_LABEL: Record<IssueCategory, string> = {
  plumbing: '수도/하수',
  electrical: '전기',
  boiler: '보일러/난방',
  waterproof: '누수/방수',
  interior: '내부 마감',
  appliance: '빌트인 가전',
  other: '기타',
};
const STATUS_LABEL: Record<IssueStatus, string> = {
  reported: '제보됨',
  reviewing: '검토중',
  resolved: '처리완료',
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

onMounted(() => issues.loadMine());
</script>

<template>
  <section class="page">
    <header class="head">
      <p class="eyebrow">제보 이력</p>
      <h1 class="title">하자 제보 내역</h1>
    </header>

    <p v-if="!issues.loading && issues.mine.length === 0" class="empty">
      <span class="empty__dot" aria-hidden="true" />제보한 하자가 없습니다.
    </p>

    <ul v-else class="list">
      <li v-for="it in issues.mine" :key="it.id">
        <BaseCard>
          <article class="issue">
            <div class="issue__head">
              <span class="cat">{{ CATEGORY_LABEL[it.category] }}</span>
              <span class="status">{{ STATUS_LABEL[it.status] }}</span>
            </div>
            <p class="issue__desc">{{ it.description }}</p>
            <div class="issue__foot">
              <span class="num">제안 수선비율 {{ it.proposedRepairRate }}%</span>
              <time class="num date">{{ fmtDate(it.createdAt) }}</time>
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
.issue__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cat {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink, #1e2331);
}
.status {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--r-pill, 999px);
  background: var(--paper-sunk, #f4f2ed);
  color: var(--ink-3, #5e6675);
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
  font-size: 13px;
  color: var(--ink-2, #3a4151);
}
.num {
  font-variant-numeric: tabular-nums;
}
.date {
  color: var(--ink-4, #8c939f);
  font-size: 11px;
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
</style>
