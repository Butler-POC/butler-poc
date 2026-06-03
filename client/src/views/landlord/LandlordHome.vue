<script setup lang="ts">
// 임대인 메인화면 — 오늘의 전달사항(헤드라인 + 우선순위 정렬 리스트)
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import {
  getDigest,
  dismissNotice,
  implicitRenew,
  type Notice,
} from '@/api/digest';

const auth = useAuthStore();
const router = useRouter();

const notices = ref<Notice[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const busy = ref<Set<string>>(new Set()); // 처리 중 noticeKey

onMounted(load);

async function load() {
  loading.value = true;
  error.value = null;
  try {
    notices.value = await getDigest();
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '전달사항을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
}

const userName = computed(() => auth.user?.name ?? '');
const top = computed<Notice | null>(() => notices.value[0] ?? null);

/* ── 표시 텍스트 ── */
function won(v: number | null | undefined): string {
  return v == null ? '' : `₩${v.toLocaleString()}`;
}
function unitLabel(n: Notice): string {
  return n.unit || `${n.tenantName} 세대`;
}

/** 헤드라인 문구 — 리스트 최상단 사항 기준 */
function headlineText(n: Notice | null): string {
  if (!n) return '오늘은 전달드릴 사항이 없어요.';
  switch (n.type) {
    case 'RENT_DUE':
      return `오늘은 ${n.tenantName} 님의 월세 납부일이에요.`;
    case 'LEASE_EXPIRING':
      return n.daysUntil === 0
        ? `${n.tenantName} 님의 계약이 오늘 만료돼요.`
        : `${n.tenantName} 님의 계약이 ${n.daysUntil}일 뒤 만료돼요.`;
    case 'OVERDUE':
      return `${n.tenantName} 님의 월세가 ${n.overdueMonths}개월 밀려 있어요.`;
    case 'VACANT_UNREGISTERED':
      return `${unitLabel(n)}가 공실이 됐어요. 처리해 주세요.`;
  }
}

const TYPE_LABEL: Record<Notice['type'], string> = {
  RENT_DUE: '오늘 월세 납부',
  LEASE_EXPIRING: '계약 만료 임박',
  OVERDUE: '월세 연체',
  VACANT_UNREGISTERED: '공실 미처리',
};

/** 카드 제목 */
function title(n: Notice): string {
  switch (n.type) {
    case 'RENT_DUE':
      return `${n.tenantName} 님 · 오늘 월세 납부일`;
    case 'LEASE_EXPIRING':
      return n.daysUntil === 0
        ? `${n.tenantName} 님 · 오늘 계약 만료`
        : `${n.tenantName} 님 · 계약 만료 ${n.daysUntil}일 전`;
    case 'OVERDUE':
      return `${n.tenantName} 님 · 월세 ${n.overdueMonths}개월 연체`;
    case 'VACANT_UNREGISTERED':
      return `${unitLabel(n)} · 공실 미처리`;
  }
}

/** 카드 보조 설명 */
function subtitle(n: Notice): string {
  const place = [n.buildingName || n.address, n.unit].filter(Boolean).join(' · ');
  switch (n.type) {
    case 'RENT_DUE':
      return `${place} · 월세 ${won(n.monthlyRent)} · 매월 ${n.dueDay}일 납부`;
    case 'LEASE_EXPIRING':
      return `${place} · 만료일 ${n.leaseEnd}`;
    case 'OVERDUE':
      return `${place} · 연체액 ${won(n.overdueAmount)} (월세 ${n.overdueMonths}개월분)`;
    case 'VACANT_UNREGISTERED':
      return `${place} · 이전 계약 만료 ${n.leaseEnd}`;
  }
}

/* ── 동작 ── */
async function remove(n: Notice) {
  if (busy.value.has(n.key)) return;
  busy.value.add(n.key);
  try {
    await dismissNotice(n.key);
    notices.value = notices.value.filter((x) => x.key !== n.key);
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '삭제에 실패했습니다.';
  } finally {
    busy.value.delete(n.key);
  }
}

async function renew(n: Notice) {
  if (busy.value.has(n.key)) return;
  busy.value.add(n.key);
  try {
    await implicitRenew(n.tenantId);
    // 같은 세입자의 계약기간 관련(만료임박·공실) 사항 제거
    notices.value = notices.value.filter(
      (x) =>
        !(
          x.tenantId === n.tenantId &&
          (x.type === 'VACANT_UNREGISTERED' || x.type === 'LEASE_EXPIRING')
        ),
    );
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '묵시적 갱신 처리에 실패했습니다.';
  } finally {
    busy.value.delete(n.key);
  }
}

function registerVacancy(n: Notice) {
  router.push({
    name: 'landlord-vacancies',
    query: n.unit ? { buildingId: n.buildingId, unit: n.unit } : { buildingId: n.buildingId },
  });
}
</script>

<template>
  <div class="home">
    <!-- 헤드라인 -->
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

    <!-- 전달사항 리스트 -->
    <ul v-else class="list">
      <li
        v-for="n in notices"
        :key="n.key"
        class="card"
        :class="n.type.toLowerCase()"
      >
        <div class="card-main">
          <div class="card-head">
            <span class="chip">{{ TYPE_LABEL[n.type] }}</span>
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

          <!-- 공실 미처리: 처리 버튼 -->
          <div v-if="n.type === 'VACANT_UNREGISTERED'" class="acts">
            <button
              class="act primary"
              type="button"
              :disabled="busy.has(n.key)"
              @click="registerVacancy(n)"
            >
              공실로 등록
            </button>
            <button
              class="act"
              type="button"
              :disabled="busy.has(n.key)"
              @click="renew(n)"
            >
              묵시적 갱신
            </button>
          </div>
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

/* 헤드라인 */
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

/* 리스트 */
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
/* 좌측 우선순위 색 띠 */
.card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--slate-300);
}
.card.rent_due::before {
  background: var(--brass);
}
.card.lease_expiring::before {
  background: var(--amber);
}
.card.overdue::before {
  background: var(--crimson);
}
.card.vacant_unregistered::before {
  background: var(--sage);
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
.card.rent_due .chip {
  background: var(--brass-soft);
  color: var(--brass-ink);
}
.card.lease_expiring .chip {
  background: var(--amber-soft);
  color: var(--brass-deep);
}
.card.overdue .chip {
  background: var(--crimson-soft);
  color: var(--crimson);
}
.card.vacant_unregistered .chip {
  background: var(--sage-soft);
  color: var(--sage);
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
.acts {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.act {
  appearance: none;
  border: 1px solid var(--slate-200);
  background: var(--paper);
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  padding: 8px 14px;
  border-radius: var(--r-pill);
  cursor: pointer;
}
.act.primary {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}
.act:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
