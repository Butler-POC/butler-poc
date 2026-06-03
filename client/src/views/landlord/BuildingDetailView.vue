<script setup lang="ts">
// 건물 상세 — 내 건물 목록에서 건물을 클릭해 진입.
// 건축물대장(L-02) 정보를 정리해 보여주고, 건축물대장 등록/수정 · 건물 삭제 진입점을 제공한다.
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useBuildingsStore } from '@/stores/buildings';

const route = useRoute();
const router = useRouter();
const store = useBuildingsStore();
const { items } = storeToRefs(store);

const buildingId = route.params.id as string;
const loading = ref(true);
const confirming = ref(false);
const deleting = ref(false);
const error = ref<string | null>(null);

const building = computed(() => items.value.find((b) => b.id === buildingId) ?? null);
const ledger = computed(() => building.value?.ledger ?? null);

onMounted(async () => {
  if (!store.loaded) await store.fetch();
  loading.value = false;
});

function num(v: number | null | undefined, unit = ''): string | null {
  return v == null ? null : `${v.toLocaleString()}${unit}`;
}

// 건축물대장 표시용 행(값 있는 것만)
const ledgerRows = computed<{ label: string; value: string }[]>(() => {
  const l = ledger.value;
  if (!l) return [];
  const floors =
    l.floorsAbove != null || l.floorsBelow != null
      ? [l.floorsAbove != null ? `지상 ${l.floorsAbove}층` : null, l.floorsBelow != null ? `지하 ${l.floorsBelow}층` : null]
          .filter(Boolean)
          .join(' · ')
      : null;
  const raw: { label: string; value: string | null }[] = [
    { label: '대지위치', value: l.siteAddress },
    { label: '지번', value: l.lotNumber },
    { label: '건축물 명칭', value: l.buildingName },
    { label: '주용도', value: l.mainUsage },
    { label: '주구조', value: l.mainStructure },
    { label: '대지면적', value: num(l.landArea, '㎡') },
    { label: '건축면적', value: num(l.buildingArea, '㎡') },
    { label: '연면적', value: num(l.totalFloorArea, '㎡') },
    { label: '건폐율', value: num(l.buildingCoverageRatio, '%') },
    { label: '용적률', value: num(l.floorAreaRatio, '%') },
    { label: '층수', value: floors },
    { label: '높이', value: num(l.height, 'm') },
    { label: '세대/가구/호수', value: l.households },
    { label: '주차', value: l.parking },
    { label: '사용승인일', value: l.approvalDate },
  ];
  return raw.filter((r): r is { label: string; value: string } => !!r.value);
});

function editLedger() {
  router.push(`/app/landlord/buildings/${buildingId}/ledger`);
}

async function confirmDelete() {
  if (deleting.value) return;
  deleting.value = true;
  error.value = null;
  try {
    await store.remove(buildingId);
    router.push('/app/landlord/buildings');
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '삭제에 실패했습니다. 다시 시도해 주세요.';
    deleting.value = false;
    confirming.value = false;
  }
}
</script>

<template>
  <div class="view">
    <RouterLink class="back" to="/app/landlord/buildings">← 목록으로</RouterLink>

    <p v-if="loading" class="state">불러오는 중…</p>
    <p v-else-if="!building" class="state">건물을 찾을 수 없습니다.</p>

    <template v-else>
      <header class="head">
        <p class="eyebrow">임대인 · 건물 상세</p>
        <h1 class="title">{{ building.buildingName || building.address }}</h1>
        <p v-if="building.buildingName" class="sub">{{ building.address }}</p>
      </header>

      <!-- 건축물대장 정보 -->
      <section class="panel">
        <div class="panel-head">
          <h2 class="panel-title">건축물대장</h2>
          <span v-if="ledger" class="src" :class="ledger.source">
            {{ ledger.source === 'ocr' ? 'OCR' : '수동' }}
          </span>
        </div>

        <dl v-if="ledgerRows.length" class="rows">
          <div v-for="r in ledgerRows" :key="r.label" class="row">
            <dt class="r-label">{{ r.label }}</dt>
            <dd class="r-value">{{ r.value }}</dd>
          </div>
        </dl>
        <p v-else class="ledger-empty">아직 건축물대장이 등록되지 않았습니다.</p>
      </section>

      <div v-if="error" class="error">{{ error }}</div>

      <!-- 동작: 건축물대장 등록/수정 → 삭제 -->
      <div class="cta">
        <button class="btn primary" type="button" @click="editLedger">
          {{ ledger ? '건축물대장 수정' : '＋ 건축물대장 등록' }}
        </button>
        <button class="btn danger" type="button" @click="confirming = true">건물 등록 해제(삭제)</button>
      </div>
    </template>

    <!-- 삭제 확인 팝업 -->
    <div v-if="confirming" class="modal-root" @click.self="confirming = false">
      <div class="modal" role="alertdialog" aria-modal="true">
        <h3 class="m-title">건물을 삭제할까요?</h3>
        <p class="m-warn">
          이 건물을 삭제하면 <strong>등록된 임차인·공실 등 이 건물과 관련된 모든 정보가 함께 삭제</strong>되며,
          삭제 후에는 되돌릴 수 없습니다.
        </p>
        <div class="m-actions">
          <button class="btn ghost" type="button" :disabled="deleting" @click="confirming = false">취소</button>
          <button class="btn danger" type="button" :disabled="deleting" @click="confirmDelete">
            {{ deleting ? '삭제 중…' : '삭제' }}
          </button>
        </div>
      </div>
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
.state {
  margin: 24px 0;
  text-align: center;
  font-size: 14px;
  color: var(--ink-3);
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
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
}
.sub {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
}
.panel {
  background: var(--paper-raised);
  border: 1px solid var(--slate-100);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-1);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink);
}
.src {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 3px 8px;
  border-radius: var(--r-pill);
}
.src.ocr {
  background: var(--brass-soft);
  color: var(--brass-ink);
}
.src.manual {
  background: var(--paper-sunk);
  color: var(--ink-3);
  border: 1px solid var(--slate-200);
}
.rows {
  margin: 0;
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 9px 0;
  border-bottom: 1px solid var(--slate-100);
}
.row:last-child {
  border-bottom: none;
}
.r-label {
  flex-shrink: 0;
  width: 96px;
  font-size: 12.5px;
  color: var(--ink-3);
}
.r-value {
  margin: 0;
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  word-break: break-word;
}
.ledger-empty {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
  background: var(--paper-sunk);
  border-radius: var(--r-input);
  padding: 14px;
  text-align: center;
}
.error {
  font-size: 13px;
  color: var(--crimson);
  background: var(--crimson-soft);
  border-radius: var(--r-input);
  padding: 10px 12px;
}
.cta {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.btn {
  appearance: none;
  border: none;
  border-radius: var(--r-pill);
  padding: 14px 20px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.btn.primary {
  background: var(--ink);
  color: var(--paper);
}
.btn.danger {
  background: var(--crimson-soft);
  color: var(--crimson);
  border: 1px solid var(--crimson);
}
.btn.ghost {
  background: var(--paper);
  color: var(--ink-2);
  border: 1px solid var(--slate-200);
}
.btn:disabled {
  opacity: 0.5;
  cursor: default;
}

/* 삭제 확인 팝업 */
.modal-root {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: rgba(20, 18, 14, 0.45);
}
.modal {
  width: 100%;
  max-width: 340px;
  background: var(--paper-raised);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-3);
  padding: 22px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.m-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}
.m-warn {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-2);
}
.m-warn strong {
  color: var(--crimson);
}
.m-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.m-actions .btn {
  flex: 1;
  padding: 12px;
  font-size: 14px;
}
</style>
