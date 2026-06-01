<script setup lang="ts">
import type { Building } from '@/types/building';

defineProps<{ building: Building }>();
defineEmits<{ (e: 'remove', id: string): void }>();
</script>

<template>
  <article class="card">
    <div class="top">
      <span class="badge" :class="building.source">
        {{ building.source === 'ocr' ? 'OCR' : '수동' }}
      </span>
      <button class="del" type="button" title="삭제" @click="$emit('remove', building.id)">
        ✕
      </button>
    </div>

    <h3 class="addr">{{ building.address }}</h3>
    <p v-if="building.buildingName" class="bname">{{ building.buildingName }}</p>

    <div class="chips">
      <span v-if="building.usage" class="chip">{{ building.usage }}</span>
      <span v-if="building.structure" class="chip">{{ building.structure }}</span>
      <span v-if="building.totalFloorArea" class="chip numeric">
        {{ building.totalFloorArea.toLocaleString() }}㎡
      </span>
      <span v-if="building.floors" class="chip">{{ building.floors }}</span>
    </div>

    <div v-if="building.ownerName" class="owner">
      소유자 <strong>{{ building.ownerName }}</strong>
      <span v-if="building.ownerShare" class="share">({{ building.ownerShare }})</span>
    </div>

    <div v-if="building.mortgages && building.mortgages.length" class="mort">
      <p class="mort-title">
        <span class="dot" /> 근저당권 {{ building.mortgages.length }}건
      </p>
      <p v-for="(m, i) in building.mortgages" :key="i" class="mort-line">
        <span v-if="m.maxClaimAmount" class="numeric">
          채권최고액 ₩{{ m.maxClaimAmount.toLocaleString() }}
        </span>
        <span v-if="m.creditor" class="creditor">{{ m.creditor }}</span>
      </p>
    </div>

    <!-- L-02 건축물대장 -->
    <div class="ledger">
      <template v-if="building.ledger">
        <div class="ledger-chips">
          <span v-if="building.ledger.mainUsage" class="chip">{{ building.ledger.mainUsage }}</span>
          <span v-if="building.ledger.buildingCoverageRatio != null" class="chip numeric">
            건폐율 {{ building.ledger.buildingCoverageRatio }}%
          </span>
          <span v-if="building.ledger.floorAreaRatio != null" class="chip numeric">
            용적률 {{ building.ledger.floorAreaRatio }}%
          </span>
          <span v-if="building.ledger.approvalDate" class="chip">사용승인 {{ building.ledger.approvalDate }}</span>
        </div>
        <RouterLink class="ledger-link" :to="`/app/landlord/buildings/${building.id}/ledger`">
          건축물대장 수정
        </RouterLink>
      </template>
      <RouterLink v-else class="ledger-link add" :to="`/app/landlord/buildings/${building.id}/ledger`">
        ＋ 건축물대장 등록
      </RouterLink>
    </div>

    <!-- L-03 임차인 -->
    <RouterLink class="tenants-link" :to="`/app/landlord/buildings/${building.id}/tenants`">
      <span class="tenants-count">
        임차인 {{ building._count?.tenants ?? 0 }}명
        <span v-if="building.overdueTenants" class="overdue-badge">연체 {{ building.overdueTenants }}</span>
      </span>
      <span class="tenants-go">관리 →</span>
    </RouterLink>

    <!-- L-07 공실 -->
    <RouterLink class="tenants-link" :to="`/app/landlord/buildings/${building.id}/vacancies`">
      <span class="tenants-count">공실 {{ building._count?.vacancies ?? 0 }}건</span>
      <span class="tenants-go">관리 →</span>
    </RouterLink>
  </article>
</template>

<style scoped>
.card {
  background: var(--paper-raised);
  border: 1px solid var(--slate-100);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-1);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.top {
  display: flex;
  align-items: center;
}
.badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: var(--r-pill);
}
.badge.ocr {
  background: var(--brass-soft);
  color: var(--brass-ink);
}
.badge.manual {
  background: var(--paper-sunk);
  color: var(--ink-3);
  border: 1px solid var(--slate-200);
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
.addr {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
}
.bname {
  margin: -4px 0 0;
  font-size: 13px;
  color: var(--ink-3);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  font-size: 11px;
  font-weight: 500;
  color: var(--ink-2);
  background: var(--paper-sunk);
  border: 1px solid var(--slate-200);
  padding: 3px 9px;
  border-radius: var(--r-pill);
}
.owner {
  font-size: 13px;
  color: var(--ink-2);
}
.share {
  color: var(--ink-4);
}
.mort {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-top: 1px solid var(--slate-100);
  padding-top: 8px;
}
.mort-title {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--amber);
  display: flex;
  align-items: center;
  gap: 5px;
}
.mort-title .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--amber);
}
.mort-line {
  margin: 0;
  font-size: 12px;
  color: var(--ink-2);
}
.creditor {
  color: var(--ink-3);
  margin-left: 6px;
}
.ledger {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-top: 1px solid var(--slate-100);
  padding-top: 8px;
}
.ledger-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.ledger-link {
  align-self: flex-start;
  font-size: 12px;
  font-weight: 600;
  color: var(--brass-ink);
  text-decoration: none;
}
.ledger-link.add {
  color: var(--ink-2);
}
.tenants-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--slate-100);
  padding-top: 10px;
  margin-top: 2px;
  text-decoration: none;
  font-size: 13px;
}
.tenants-count {
  font-weight: 600;
  color: var(--ink-2);
}
.overdue-badge {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--crimson);
  background: var(--crimson-soft);
  padding: 2px 7px;
  border-radius: var(--r-pill);
}
.tenants-go {
  font-size: 12px;
  font-weight: 600;
  color: var(--brass-ink);
}
</style>
