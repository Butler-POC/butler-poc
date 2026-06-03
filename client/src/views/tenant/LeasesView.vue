<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useLeasesStore } from '@/stores/leases';
import { parseLease, setLeaseRent, type Lease, type LeaseFields } from '@/api/leases';
import { checkUploadSize } from '@/lib/upload';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';

const store = useLeasesStore();
const { items, loading } = storeToRefs(store);

type Mode = 'ocr' | 'manual';
const mode = ref<Mode>('ocr');
const adding = ref(false);

const emptyForm = (): LeaseFields => ({
  address: '',
  buildingName: '',
  unit: '',
  lessorName: '',
  deposit: null,
  monthlyRent: null,
  maintenanceFee: null,
  paymentDay: null,
  leaseStart: '',
  leaseEnd: '',
  contractDate: '',
  specialTerms: '',
});
const form = reactive<LeaseFields>(emptyForm());

const fileInput = ref<HTMLInputElement | null>(null);
const parsing = ref(false);
const parsed = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

onMounted(() => {
  if (!store.loaded) store.fetch();
});

function openAdd() {
  Object.assign(form, emptyForm());
  parsed.value = false;
  error.value = null;
  mode.value = 'ocr';
  adding.value = true;
}

function cancelAdd() {
  adding.value = false;
  error.value = null;
}

function setMode(m: Mode) {
  mode.value = m;
  error.value = null;
}

function pickFile() {
  if (!parsing.value) fileInput.value?.click();
}

function fillForm(f: Partial<LeaseFields>) {
  form.address = f.address ?? '';
  form.buildingName = f.buildingName ?? '';
  form.unit = f.unit ?? '';
  form.lessorName = f.lessorName ?? '';
  form.deposit = f.deposit ?? null;
  form.monthlyRent = f.monthlyRent ?? null;
  form.maintenanceFee = f.maintenanceFee ?? null;
  form.paymentDay = f.paymentDay ?? null;
  form.leaseStart = f.leaseStart ?? '';
  form.leaseEnd = f.leaseEnd ?? '';
  form.contractDate = f.contractDate ?? '';
  form.specialTerms = f.specialTerms ?? '';
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const sizeError = checkUploadSize(file);
  if (sizeError) {
    error.value = sizeError;
    if (fileInput.value) fileInput.value.value = '';
    return;
  }
  parsing.value = true;
  parsed.value = false;
  error.value = null;
  try {
    const { fields } = await parseLease(file);
    fillForm(fields);
    parsed.value = true;
  } catch (e: any) {
    error.value =
      e?.response?.data?.error ??
      '문서 분석에 실패했습니다. 직접 입력으로 등록할 수 있습니다.';
  } finally {
    parsing.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}

async function save() {
  if (saving.value) return;
  if (!form.address?.trim()) {
    error.value = '임차 건물 주소는 필수입니다.';
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    await store.add({
      ...form,
      address: form.address.trim(),
      source: parsed.value ? 'ocr' : 'manual',
    });
    adding.value = false;
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '저장에 실패했습니다. 다시 시도해 주세요.';
  } finally {
    saving.value = false;
  }
}

const pendingDelete = ref<Lease | null>(null);
const deleting = ref(false);

function askDelete(l: Lease) {
  pendingDelete.value = l;
}

async function confirmDelete() {
  const l = pendingDelete.value;
  if (!l || deleting.value) return;
  deleting.value = true;
  error.value = null;
  try {
    await store.remove(l.id);
    pendingDelete.value = null;
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '삭제에 실패했습니다.';
  } finally {
    deleting.value = false;
  }
}

function won(v: number | null): string {
  return v == null ? '' : `₩${v.toLocaleString()}`;
}

/* 월세 납부 처리/취소 (임대인 임차인 카드와 동일 메커니즘) */
function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

async function applyRent(l: Lease, lastPaidMonth: string) {
  try {
    const updated = await setLeaseRent(l.id, lastPaidMonth);
    const i = items.value.findIndex((x) => x.id === l.id);
    if (i !== -1) items.value[i] = updated;
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '월세 상태 변경에 실패했습니다.';
  }
}

function markPaid(l: Lease) {
  const due = l.rentStatus?.dueMonth;
  if (due) applyRent(l, due);
}

function markUnpaid(l: Lease) {
  const due = l.rentStatus?.dueMonth;
  if (due) applyRent(l, prevMonth(due));
}
</script>

<template>
  <div class="view">
    <RouterLink class="back" to="/app/tenant">← 홈으로</RouterLink>

    <header class="head">
      <p class="eyebrow">임차인</p>
      <h1 class="title">임차 건물</h1>
      <p class="desc">임대차계약서를 스캔하면 정보를 자동으로 채웁니다. 직접 입력도 가능합니다.</p>
    </header>

    <button v-if="!adding" class="add" type="button" @click="openAdd">＋ 임차 건물 등록</button>

    <!-- 등록 폼 -->
    <section v-if="adding" class="panel">
      <div class="segmented">
        <button type="button" class="seg" :class="{ active: mode === 'ocr' }" @click="setMode('ocr')">
          계약서 스캔
        </button>
        <button type="button" class="seg" :class="{ active: mode === 'manual' }" @click="setMode('manual')">
          직접 입력
        </button>
      </div>

      <div v-if="mode === 'ocr'" class="dropzone" :class="{ busy: parsing }" @click="pickFile">
        <input ref="fileInput" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" hidden @change="onFile" />
        <template v-if="parsing">
          <p class="dz-title">분석 중…</p>
          <p class="dz-sub">계약서에서 정보를 추출하고 있습니다</p>
        </template>
        <template v-else-if="parsed">
          <p class="dz-title">추출 완료 — 아래에서 확인·수정하세요</p>
          <p class="dz-sub">다른 파일로 다시 스캔하려면 누르세요</p>
        </template>
        <template v-else>
          <p class="dz-title">임대차계약서를 끌어다 놓거나 눌러서 선택</p>
          <p class="dz-sub">PDF 최대 20MB · 이미지 최대 7.5MB</p>
        </template>
      </div>

      <div v-if="parsed" class="parsed-note">추출된 값을 확인해 주세요.</div>

      <form class="form" @submit.prevent="save">
        <div class="field">
          <label class="label">임차 건물 주소 *</label>
          <input v-model="form.address" class="input" type="text" placeholder="서울특별시 ○○구 ○○로 12" />
        </div>

        <div class="row">
          <div class="field">
            <label class="label">건물 명칭</label>
            <input v-model="form.buildingName" class="input" type="text" placeholder="○○아파트" />
          </div>
          <div class="field">
            <label class="label">동/호</label>
            <input v-model="form.unit" class="input" type="text" placeholder="101동 502호" />
          </div>
        </div>

        <div class="field">
          <label class="label">임대인</label>
          <input v-model="form.lessorName" class="input" type="text" placeholder="김임대" />
        </div>

        <div class="row">
          <div class="field">
            <label class="label">보증금(원)</label>
            <input v-model.number="form.deposit" class="input" type="number" placeholder="50000000" />
          </div>
          <div class="field">
            <label class="label">월세(원)</label>
            <input v-model.number="form.monthlyRent" class="input" type="number" placeholder="800000" />
          </div>
        </div>

        <div class="row">
          <div class="field">
            <label class="label">관리비(원)</label>
            <input v-model.number="form.maintenanceFee" class="input" type="number" placeholder="70000" />
          </div>
          <div class="field">
            <label class="label">월세 납부일</label>
            <input v-model.number="form.paymentDay" class="input" type="number" min="1" max="31" placeholder="25" />
          </div>
        </div>

        <div class="row">
          <div class="field">
            <label class="label">계약 시작일</label>
            <input v-model="form.leaseStart" class="input" type="text" placeholder="2025-03-01" />
          </div>
          <div class="field">
            <label class="label">계약 종료일</label>
            <input v-model="form.leaseEnd" class="input" type="text" placeholder="2027-02-28" />
          </div>
        </div>

        <div class="field">
          <label class="label">계약 체결일</label>
          <input v-model="form.contractDate" class="input" type="text" placeholder="2025-02-10" />
        </div>

        <div class="field">
          <label class="label">특약사항</label>
          <textarea v-model="form.specialTerms" class="input area" rows="3" placeholder="특약사항 (하자 상담 시 활용됩니다)" />
        </div>

        <div v-if="error" class="error">{{ error }}</div>

        <div class="actions">
          <button class="btn primary" type="submit" :disabled="saving || parsing">
            {{ saving ? '저장 중…' : '임차 건물 등록' }}
          </button>
          <button class="btn ghost" type="button" :disabled="saving" @click="cancelAdd">취소</button>
        </div>
      </form>
    </section>

    <!-- 목록 -->
    <p v-if="loading" class="empty">불러오는 중…</p>
    <p v-else-if="items.length === 0 && !adding" class="empty">등록된 임차 건물이 없습니다.</p>

    <div v-if="items.length" class="list">
      <article
        v-for="l in items"
        :key="l.id"
        class="card"
        :class="{ overdue: l.rentStatus?.state === 'OVERDUE' }"
      >
        <div class="card-top">
          <span class="badge" :class="l.source">{{ l.source === 'ocr' ? 'OCR' : '수동' }}</span>
        </div>

        <h3 class="addr">{{ l.address }}</h3>
        <p v-if="l.buildingName || l.unit" class="sub">
          <span v-if="l.buildingName">{{ l.buildingName }}</span>
          <span v-if="l.unit" class="unit">{{ l.unit }}</span>
        </p>

        <div class="money">
          <span v-if="l.deposit != null" class="m">보증금 <strong class="numeric">{{ won(l.deposit) }}</strong></span>
          <span v-if="l.monthlyRent != null" class="m">월세 <strong class="numeric">{{ won(l.monthlyRent) }}</strong></span>
          <span v-if="l.paymentDay != null" class="m">납부일 <strong class="numeric">매월 {{ l.paymentDay }}일</strong></span>
        </div>

        <div
          v-if="l.rentStatus && l.rentStatus.state !== 'NO_RENT'"
          class="rent"
          :class="l.rentStatus.state.toLowerCase()"
        >
          <span class="rent-label">
            <template v-if="l.rentStatus.state === 'OVERDUE'">
              ⚠ 월세 연체 {{ l.rentStatus.overdueMonths }}개월 (최종납부 {{ l.rentStatus.lastPaidMonth }})
            </template>
            <template v-else-if="l.rentStatus.state === 'PAID'">
              월세 납부 완료 ({{ l.rentStatus.lastPaidMonth }})
            </template>
            <template v-else>월세 납부 정보 없음</template>
          </span>
          <button
            v-if="l.rentStatus.state === 'PAID'"
            class="rent-btn"
            type="button"
            @click="markUnpaid(l)"
          >
            납부 취소
          </button>
          <button v-else class="rent-btn pay" type="button" @click="markPaid(l)">
            {{ l.rentStatus.dueMonth }} 납부 처리
          </button>
        </div>

        <div v-if="l.leaseStart || l.leaseEnd" class="lease">
          계약기간 {{ l.leaseStart || '?' }} ~ {{ l.leaseEnd || '?' }}
        </div>
        <p v-if="l.lessorName" class="lessor">임대인 {{ l.lessorName }}</p>
        <p v-if="l.specialTerms" class="terms">{{ l.specialTerms }}</p>

        <button class="card-del" type="button" @click="askDelete(l)">임차 건물 삭제</button>
      </article>
    </div>

    <ConfirmDialog
      :open="!!pendingDelete"
      title="임차 건물을 삭제할까요?"
      :busy="deleting"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    >
      <strong>{{ pendingDelete?.buildingName || pendingDelete?.address }}</strong> 임차 건물을
      삭제하면 계약·월세 납부 정보 등 관련된 정보가 모두 삭제되며, 되돌릴 수 없습니다.
    </ConfirmDialog>
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
  font-size: 14px;
  color: var(--ink-2);
}
.add {
  display: block;
  text-align: center;
  background: var(--ink);
  color: var(--paper);
  border: none;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  padding: 13px;
  border-radius: var(--r-pill);
  cursor: pointer;
}
.panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--paper-raised);
  border: 1px solid var(--slate-100);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-1);
  padding: 16px;
}
.segmented {
  display: flex;
  gap: 6px;
}
.seg {
  flex: 1;
  appearance: none;
  border: 1px solid var(--slate-200);
  background: var(--paper);
  color: var(--ink-2);
  border-radius: var(--r-pill);
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.seg.active {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}
.dropzone {
  border: 1.5px dashed var(--slate-300);
  border-radius: var(--r-card);
  background: var(--paper-sunk);
  padding: 24px 20px;
  text-align: center;
  cursor: pointer;
}
.dropzone.busy {
  opacity: 0.7;
  cursor: default;
}
.dz-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.dz-sub {
  margin: 4px 0 0;
  font-size: 12px;
  color: var(--ink-3);
}
.parsed-note {
  font-size: 12px;
  color: var(--brass-ink);
  background: var(--brass-soft);
  border-radius: var(--r-input);
  padding: 10px 12px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.row {
  display: flex;
  gap: 10px;
}
.row .field {
  flex: 1;
  min-width: 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2);
}
.input {
  appearance: none;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--slate-300);
  border-radius: var(--r-input);
  background: var(--paper-raised);
  font-size: 15px;
  font-family: inherit;
  color: var(--ink);
}
.input:focus {
  outline: none;
  border-color: var(--ink);
  border-width: 1.5px;
}
.area {
  resize: vertical;
  line-height: 1.5;
}
.error {
  font-size: 13px;
  color: var(--crimson);
  background: var(--crimson-soft);
  border-radius: var(--r-input);
  padding: 10px 12px;
}
.actions {
  display: flex;
  gap: 10px;
}
.btn {
  appearance: none;
  border: none;
  border-radius: var(--r-pill);
  padding: 13px 20px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.btn.primary {
  flex: 1;
  background: var(--ink);
  color: var(--paper);
}
.btn.ghost {
  background: transparent;
  color: var(--ink-2);
  border: 1px solid var(--slate-200);
}
.btn:disabled {
  opacity: 0.4;
  cursor: default;
}
.empty {
  margin: 16px 0;
  text-align: center;
  font-size: 14px;
  color: var(--ink-3);
}
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
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
.card-top {
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
.card-del {
  align-self: stretch;
  margin-top: 4px;
  appearance: none;
  border: 1px solid var(--crimson);
  background: var(--crimson-soft);
  color: var(--crimson);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  padding: 10px;
  border-radius: var(--r-pill);
  cursor: pointer;
}
.card-del:active {
  opacity: 0.8;
}
.addr {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
}
.sub {
  margin: -4px 0 0;
  font-size: 13px;
  color: var(--ink-3);
}
.unit {
  margin-left: 6px;
}
.money {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  font-size: 13px;
  color: var(--ink-2);
}
.money strong {
  color: var(--ink);
}
.lease {
  font-size: 12px;
  color: var(--ink-3);
}
.lessor {
  margin: 0;
  font-size: 13px;
  color: var(--ink-2);
}
.terms {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
  white-space: pre-wrap;
  background: var(--paper-sunk);
  border-radius: var(--r-input);
  padding: 8px 10px;
}
/* 월세 납부 상태 (임대인 임차인 카드와 동일) */
.card.overdue {
  border-color: var(--crimson);
  box-shadow: 0 0 0 1px var(--crimson) inset, var(--shadow-1);
}
.rent {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  border-radius: var(--r-input);
  padding: 8px 10px;
}
.rent-label {
  font-weight: 600;
}
.rent.overdue {
  background: var(--crimson-soft);
  color: var(--crimson);
}
.rent.paid {
  background: var(--sage-soft);
  color: var(--sage);
}
.rent.unknown {
  background: var(--paper-sunk);
  color: var(--ink-3);
}
.rent-btn {
  margin-left: auto;
  appearance: none;
  border: 1px solid var(--slate-200);
  background: var(--paper);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  padding: 5px 11px;
  border-radius: var(--r-pill);
  cursor: pointer;
}
.rent-btn.pay {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}
</style>
