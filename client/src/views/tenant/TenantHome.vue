<script setup lang="ts">
// 임차인 메인화면 — 오늘의 전달사항(헤드라인 + 우선순위 정렬 리스트). 임대인 메인화면과 동일 양식.
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import {
  getTenantDigest,
  dismissTenantNotice,
  type TenantNotice,
} from '@/api/digest';

const auth = useAuthStore();

const notices = ref<TenantNotice[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const busy = ref<Set<string>>(new Set());

onMounted(load);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    notices.value = await getTenantDigest();
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '전달사항을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
}

const userName = computed(() => auth.user?.name ?? '');
const top = computed<TenantNotice | null>(() => notices.value[0] ?? null);

function won(v: number | null | undefined): string {
  return v == null ? '' : `₩${v.toLocaleString()}`;
}

/** 헤드라인 문구 — 리스트 최상단 사항 기준 */
function headlineText(n: TenantNotice | null): string {
  if (!n) return '오늘은 전달드릴 사항이 없어요.';
  switch (n.type) {
    case 'OVERDUE':
      return `월세가 ${n.overdueMonths}개월 밀려 있어요.`;
    case 'RENT_DUE':
      return '오늘은 월세 납부일이에요.';
    case 'LEASE_EXPIRING':
      return n.phase === 'RENEWAL_IMMINENT'
        ? `계약 만료 ${n.daysUntil}일 전 — 묵시적 갱신이 임박했어요.`
        : `계약 만료 ${n.daysUntil}일 전 — 퇴거 예정이면 임대인에게 통지하세요.`;
  }
}

function chipLabel(n: TenantNotice): string {
  switch (n.type) {
    case 'OVERDUE':
      return '월세 연체';
    case 'RENT_DUE':
      return '오늘 월세 납부';
    case 'LEASE_EXPIRING':
      return n.phase === 'RENEWAL_IMMINENT' ? '묵시적 갱신 임박' : '퇴거 통지 기간';
  }
}

function title(n: TenantNotice): string {
  switch (n.type) {
    case 'OVERDUE':
      return `월세 ${n.overdueMonths}개월 연체`;
    case 'RENT_DUE':
      return '오늘 월세 납부일';
    case 'LEASE_EXPIRING':
      return n.phase === 'RENEWAL_IMMINENT'
        ? `계약 만료 ${n.daysUntil}일 전 · 묵시적 갱신 임박`
        : `계약 만료 ${n.daysUntil}일 전 · 통지 기간`;
  }
}

function place(n: TenantNotice): string {
  return [n.buildingName || n.address, n.unit].filter(Boolean).join(' · ');
}

function subtitle(n: TenantNotice): string {
  switch (n.type) {
    case 'OVERDUE':
      return `${place(n)} · 연체액 ${won(n.overdueAmount)} · 최종납부 ${n.lastPaidMonth}`;
    case 'RENT_DUE':
      return `${place(n)} · 월세 ${won(n.monthlyRent)} · 매월 ${n.dueDay}일`;
    case 'LEASE_EXPIRING':
      return `${place(n)} · 만료일 ${n.leaseEnd}`;
  }
}

/** 계약 만료 안내의 설명(3-1 / 3-2) */
function expiryNote(n: TenantNotice): string {
  return n.phase === 'RENEWAL_IMMINENT'
    ? '별도 통지가 없으면 기존과 동일한 조건으로 자동 갱신(묵시적 갱신)될 수 있어요.'
    : '묵시적 갱신을 원치 않고 퇴거할 계획이라면, 만료 2개월 전까지 임대인에게 통지해야 해요.';
}

async function remove(n: TenantNotice) {
  if (busy.value.has(n.key)) return;
  busy.value.add(n.key);
  try {
    await dismissTenantNotice(n.key);
    notices.value = notices.value.filter((x) => x.key !== n.key);
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '삭제에 실패했습니다.';
  } finally {
    busy.value.delete(n.key);
  }
}
</script>

<template>
  <div class="home">
    <header class="headline">
      <p class="hello">{{ userName }} 님,</p>
      <h1 class="lead" :class="top ? top.type.toLowerCase() : 'none'">
        {{ headlineText(top) }}
      </h1>
    </header>

    <div v-if="error" class="banner">{{ error }}</div>

    <p v-if="loading" class="state">불러오는 중…</p>

    <p v-else-if="notices.length === 0" class="state empty">
      전달드릴 사항이 없습니다. 오늘도 평온한 하루예요.
    </p>

    <ul v-else class="list">
      <li v-for="n in notices" :key="n.key" class="card" :class="n.type.toLowerCase()">
        <div class="card-main">
          <div class="card-head">
            <span class="chip">{{ chipLabel(n) }}</span>
            <button
              class="del"
              type="button"
              title="삭제"
              :disabled="busy.has(n.key)"
              @click="remove(n)"
            >
              ✕
            </button>
          </div>
          <p class="c-title">{{ title(n) }}</p>
          <p class="c-sub">{{ subtitle(n) }}</p>
          <p v-if="n.type === 'LEASE_EXPIRING'" class="c-note">{{ expiryNote(n) }}</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.headline {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.hello {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-3);
}
.lead {
  margin: 0;
  font-size: 26px;
  line-height: 1.32;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.lead.none {
  color: var(--ink-3);
  font-weight: 700;
}
.lead.overdue {
  color: var(--crimson);
}
.lead.lease_expiring {
  color: var(--brass-deep);
}
.banner {
  font-size: 13px;
  color: var(--crimson);
  background: var(--crimson-soft);
  border-radius: var(--r-input);
  padding: 10px 12px;
}
.state {
  margin: 8px 0;
  text-align: center;
  font-size: 14px;
  color: var(--ink-3);
}
.state.empty {
  padding: 28px 16px;
  background: var(--paper-sunk);
  border: 1px solid var(--slate-100);
  border-radius: var(--r-card);
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card {
  position: relative;
  background: var(--paper-raised);
  border: 1px solid var(--slate-100);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-1);
  overflow: hidden;
}
.card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--slate-300);
}
.card.overdue::before {
  background: var(--crimson);
}
.card.rent_due::before {
  background: var(--brass);
}
.card.lease_expiring::before {
  background: var(--amber);
}
.card-main {
  padding: 14px 16px 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chip {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  padding: 3px 9px;
  border-radius: var(--r-pill);
  background: var(--paper-sunk);
  color: var(--ink-2);
}
.card.overdue .chip {
  background: var(--crimson-soft);
  color: var(--crimson);
}
.card.rent_due .chip {
  background: var(--brass-soft);
  color: var(--brass-ink);
}
.card.lease_expiring .chip {
  background: var(--amber-soft);
  color: var(--brass-deep);
}
.del {
  margin-left: auto;
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ink-4);
  font-size: 14px;
  cursor: pointer;
  padding: 2px 4px;
}
.del:hover {
  color: var(--crimson);
}
.del:disabled {
  opacity: 0.4;
  cursor: default;
}
.c-title {
  margin: 2px 0 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}
.c-sub {
  margin: 0;
  font-size: 12.5px;
  color: var(--ink-3);
  line-height: 1.45;
}
.c-note {
  margin: 6px 0 0;
  font-size: 12.5px;
  line-height: 1.5;
  color: var(--ink-2);
  background: var(--paper-sunk);
  border-radius: var(--r-input);
  padding: 9px 11px;
}
</style>
