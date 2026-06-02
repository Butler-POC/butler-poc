<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { APP_META, type UserType } from '@/types/user';

interface Feature {
  code: string;
  name: string;
  to?: string;
}

const router = useRouter();
const auth = useAuthStore();

// 모든 앱이 공통으로 쓰는 기능 (C-)
const COMMON: Feature[] = [
  { code: 'C-01', name: '문서 텍스트 추출', to: '/scan' },
  { code: 'C-02', name: '챗봇 상담' },
];

// 역할별 기능 (아직 미구현 — 목록만)
const ROLE_FEATURES: Record<UserType, Feature[]> = {
  LANDLORD: [
    { code: 'L-01', name: '내 건물 등록', to: '/app/landlord/buildings' },
    { code: 'L-02', name: '건축물대장 등록', to: '/app/landlord/buildings' },
    { code: 'L-03', name: '임차인 등록', to: '/app/landlord/buildings' },
    { code: 'L-04', name: '월세 연체 표시' },
    { code: 'L-05', name: '수선 업체 조회' },
    { code: 'L-06', name: '간단 법률 상담' },
    { code: 'L-07', name: '공실 등록', to: '/app/landlord/buildings' },
  ],
  TENANT: [
    { code: 'T-01', name: '임차 건물 등록', to: '/app/tenant/leases' },
    { code: 'T-02', name: '하자 상담' },
    { code: 'T-03', name: '하자 제보' },
  ],
  AGENT: [
    { code: 'A-01', name: '공실 조회' },
    { code: 'A-02', name: '건물주 연결' },
  ],
};

const meta = computed(() => (auth.userType ? APP_META[auth.userType] : null));
const features = computed(() => (auth.userType ? ROLE_FEATURES[auth.userType] : []));

function open(f: Feature) {
  if (f.to) router.push(f.to);
}
</script>

<template>
  <div v-if="meta" class="home">
    <header class="head">
      <p class="eyebrow">{{ meta.app }}</p>
      <h1 class="title">{{ auth.user?.name }} 님</h1>
      <p class="desc">{{ meta.label }} 전용 기능을 사용할 수 있습니다.</p>
    </header>

    <section class="group">
      <p class="group-label">공통</p>
      <ul class="list">
        <li
          v-for="f in COMMON"
          :key="f.code"
          class="row"
          :class="{ enabled: !!f.to }"
          @click="open(f)"
        >
          <span class="code">{{ f.code }}</span>
          <span class="name">{{ f.name }}</span>
          <span v-if="f.to" class="chev">→</span>
          <span v-else class="soon">준비 중</span>
        </li>
      </ul>
    </section>

    <section class="group">
      <p class="group-label">{{ meta.label }} 기능</p>
      <ul class="list">
        <li
          v-for="f in features"
          :key="f.code"
          class="row"
          :class="{ enabled: !!f.to }"
          @click="open(f)"
        >
          <span class="code">{{ f.code }}</span>
          <span class="name">{{ f.name }}</span>
          <span v-if="f.to" class="chev">→</span>
          <span v-else class="soon">준비 중</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brass-ink);
}
.title {
  font-size: 28px;
  font-weight: 700;
}
.desc {
  margin: 0;
  font-size: 14px;
  color: var(--ink-2);
}
.group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.group-label {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink-3);
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--paper-raised);
  border: 1px solid var(--slate-100);
  border-radius: var(--r-card);
  overflow: hidden;
}
.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--slate-100);
}
.row:last-child {
  border-bottom: none;
}
.row.enabled {
  cursor: pointer;
}
.row.enabled:hover {
  background: var(--paper-sunk);
}
.code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink-4);
  width: 34px;
  flex-shrink: 0;
}
.name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.chev {
  margin-left: auto;
  color: var(--brass);
  font-size: 16px;
}
.soon {
  margin-left: auto;
  font-size: 11px;
  color: var(--ink-4);
  background: var(--paper-sunk);
  border: 1px solid var(--slate-200);
  padding: 2px 8px;
  border-radius: var(--r-pill);
}
</style>
