<script setup lang="ts">
// 월세 연체자 종합 조회 — 전 건물에서 현재 월세를 납부하지 않은(연체) 임차인을 카드로 모아 본다.
// 카드를 누르면 해당 건물의 임차인 관리 페이지로 이동.
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { getOverdueTenants, type OverdueTenant } from '@/api/digest';

const router = useRouter();
const tenants = ref<OverdueTenant[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    tenants.value = await getOverdueTenants();
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '연체자 목록을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
});

function won(v: number | null): string {
  return v == null ? '' : `₩${v.toLocaleString()}`;
}

function overdueAmount(t: OverdueTenant): string {
  if (t.monthlyRent == null) return '';
  return won(t.monthlyRent * t.rentStatus.overdueMonths);
}

function openTenant(t: OverdueTenant) {
  router.push(`/app/landlord/buildings/${t.buildingId}/tenants`);
}
</script>

<template>
  <div class="view">
    <RouterLink class="back" to="/app/landlord">← 홈으로</RouterLink>

    <header class="head">
      <p class="eyebrow">임대인</p>
      <h1 class="title">현재 월세 연체자</h1>
      <p class="desc">전체 건물에서 이번 달 월세를 아직 납부하지 않은 임차인입니다.</p>
    </header>

    <div v-if="error" class="banner">{{ error }}</div>

    <p v-if="loading" class="state">불러오는 중…</p>
    <p v-else-if="tenants.length === 0" class="state empty">
      현재 월세를 연체 중인 임차인이 없습니다.
    </p>

    <div v-else class="list">
      <button
        v-for="t in tenants"
        :key="t.id"
        type="button"
        class="card"
        @click="openTenant(t)"
      >
        <div class="card-top">
          <div class="who">
            <span class="name">{{ t.name }}</span>
            <span v-if="t.unit" class="unit">{{ t.unit }}</span>
          </div>
          <span class="months">{{ t.rentStatus.overdueMonths }}개월 연체</span>
        </div>

        <p class="place">{{ t.buildingName || t.address }}</p>

        <div class="meta">
          <span v-if="t.monthlyRent != null" class="m">월세 <strong>{{ won(t.monthlyRent) }}</strong></span>
          <span v-if="t.monthlyRent != null" class="m">연체액 <strong class="danger">{{ overdueAmount(t) }}</strong></span>
          <span v-if="t.rentStatus.lastPaidMonth" class="m">최종납부 {{ t.rentStatus.lastPaidMonth }}</span>
        </div>

        <span class="go">임차인 관리 →</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.back {
  align-self: flex-start;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  text-decoration: none;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 5px;
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
  font-size: 26px;
  font-weight: 700;
}
.desc {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card {
  position: relative;
  text-align: left;
  appearance: none;
  font-family: inherit;
  cursor: pointer;
  background: var(--paper-raised);
  border: 1px solid var(--slate-100);
  border-left: 4px solid var(--crimson);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-1);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.card:active {
  background: var(--paper-sunk);
}
.card-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.who {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.name {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
}
.unit {
  font-size: 12px;
  color: var(--ink-3);
}
.months {
  margin-left: auto;
  font-size: 12px;
  font-weight: 700;
  color: var(--crimson);
  background: var(--crimson-soft);
  padding: 3px 9px;
  border-radius: var(--r-pill);
}
.place {
  margin: 0;
  font-size: 13px;
  color: var(--ink-2);
  font-weight: 600;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 12.5px;
  color: var(--ink-3);
}
.meta strong {
  color: var(--ink);
}
.meta .danger {
  color: var(--crimson);
}
.go {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--brass-ink);
}
</style>
