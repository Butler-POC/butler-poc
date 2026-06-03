<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useBuildingsStore } from '@/stores/buildings';
import {
  parseContract,
  listTenants,
  createTenant,
  deleteTenant,
  setTenantRent,
  type ContractFields,
  type Tenant,
} from '@/api/tenants';
import { checkUploadSize } from '@/lib/upload';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';

const route = useRoute();
const store = useBuildingsStore();
const { items } = storeToRefs(store);

const buildingId = route.params.id as string;
const building = computed(() => items.value.find((b) => b.id === buildingId) ?? null);

const tenants = ref<Tenant[]>([]);
const loading = ref(true);

type Mode = 'ocr' | 'manual';
const mode = ref<Mode>('ocr');
const adding = ref(false);

const emptyForm = (): ContractFields => ({
  name: '',
  contact: '',
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
const form = reactive<ContractFields>(emptyForm());

const fileInput = ref<HTMLInputElement | null>(null);
const parsing = ref(false);
const parsed = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

onMounted(async () => {
  if (!store.loaded) store.fetch();
  try {
    tenants.value = await listTenants(buildingId);
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '임차인 목록을 불러오지 못했습니다.';
  } finally {
    loading.value = false;
  }
});

function openAdd() {
  adding.value = true;
  resetForm();
}

function cancelAdd() {
  adding.value = false;
  error.value = null;
}

function resetForm() {
  Object.assign(form, emptyForm());
  parsed.value = false;
  error.value = null;
  mode.value = 'ocr';
}

function setMode(m: Mode) {
  mode.value = m;
  error.value = null;
}

function pickFile() {
  if (!parsing.value) fileInput.value?.click();
}

function fillForm(f: Partial<ContractFields>) {
  form.name = f.name ?? '';
  form.contact = f.contact ?? '';
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
    const { fields } = await parseContract(file);
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
  if (!form.name?.trim()) {
    error.value = '임차인 이름은 필수입니다.';
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    const created = await createTenant(buildingId, {
      ...form,
      source: parsed.value ? 'ocr' : 'manual',
    });
    tenants.value.unshift(created);
    const b = building.value;
    if (b) {
      b._count = {
        tenants: (b._count?.tenants ?? 0) + 1,
        vacancies: b._count?.vacancies ?? 0,
      };
    }
    adding.value = false;
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '저장에 실패했습니다. 다시 시도해 주세요.';
  } finally {
    saving.value = false;
  }
}

const pendingDelete = ref<Tenant | null>(null);
const deleting = ref(false);

function askDelete(t: Tenant) {
  pendingDelete.value = t;
}

async function confirmDelete() {
  const t = pendingDelete.value;
  if (!t || deleting.value) return;
  deleting.value = true;
  error.value = null;
  try {
    await deleteTenant(buildingId, t.id);
    tenants.value = tenants.value.filter((x) => x.id !== t.id);
    const b = building.value;
    if (b) {
      b._count = {
        tenants: Math.max(0, (b._count?.tenants ?? 1) - 1),
        vacancies: b._count?.vacancies ?? 0,
      };
    }
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

/* L-04 월세 연체 처리 */
function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

async function applyRent(t: Tenant, lastPaidMonth: string) {
  try {
    const updated = await setTenantRent(buildingId, t.id, lastPaidMonth);
    const i = tenants.value.findIndex((x) => x.id === t.id);
    if (i !== -1) tenants.value[i] = updated;
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '월세 상태 변경에 실패했습니다.';
  }
}

function markPaid(t: Tenant) {
  const due = t.rentStatus?.dueMonth;
  if (due) applyRent(t, due);
}

function markUnpaid(t: Tenant) {
  const due = t.rentStatus?.dueMonth;
  if (due) applyRent(t, prevMonth(due));
}
</script>

<template>
  <div class="view">
    <RouterLink class="back" to="/app/landlord/buildings">← 목록으로</RouterLink>

    <header class="head">
      <p class="eyebrow">임대인</p>
      <h1 class="title">임차인 관리</h1>
      <p v-if="building" class="ctx">
        <span class="ctx-addr">{{ building.address }}</span>
        <span v-if="building.buildingName" class="ctx-name">{{ building.buildingName }}</span>
      </p>
    </header>

    <button v-if="!adding" class="add" type="button" @click="openAdd">＋ 임차인 추가</button>

    <!-- 추가 폼 -->
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
        <div class="row">
          <div class="field">
            <label class="label">임차인 이름 *</label>
            <input v-model="form.name" class="input" type="text" placeholder="홍길동" />
          </div>
          <div class="field">
            <label class="label">연락처</label>
            <input v-model="form.contact" class="input" type="text" placeholder="010-1234-5678" />
          </div>
        </div>

        <div class="row">
          <div class="field">
            <label class="label">동/호</label>
            <input v-model="form.unit" class="input" type="text" placeholder="101동 502호" />
          </div>
          <div class="field">
            <label class="label">임대인(계약상)</label>
            <input v-model="form.lessorName" class="input" type="text" placeholder="김임대" />
          </div>
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
          <textarea v-model="form.specialTerms" class="input area" rows="3" placeholder="특약사항을 입력하세요" />
        </div>

        <div v-if="error" class="error">{{ error }}</div>

        <div class="actions">
          <button class="btn primary" type="submit" :disabled="saving || parsing">
            {{ saving ? '저장 중…' : '임차인 등록' }}
          </button>
          <button class="btn ghost" type="button" :disabled="saving" @click="cancelAdd">취소</button>
        </div>
      </form>
    </section>

    <!-- 목록 -->
    <p v-if="loading" class="empty">불러오는 중…</p>
    <p v-else-if="tenants.length === 0 && !adding" class="empty">등록된 임차인이 없습니다.</p>

    <div v-if="tenants.length" class="list">
      <article
        v-for="t in tenants"
        :key="t.id"
        class="card"
        :class="{ overdue: t.rentStatus?.state === 'OVERDUE' }"
      >
        <div class="card-top">
          <div class="who">
            <span class="name">{{ t.name }}</span>
            <span v-if="t.unit" class="unit">{{ t.unit }}</span>
          </div>
          <span class="badge" :class="t.source">{{ t.source === 'ocr' ? 'OCR' : '수동' }}</span>
        </div>

        <div class="money">
          <span v-if="t.deposit != null" class="m">보증금 <strong class="numeric">{{ won(t.deposit) }}</strong></span>
          <span v-if="t.monthlyRent != null" class="m">월세 <strong class="numeric">{{ won(t.monthlyRent) }}</strong></span>
          <span v-if="t.paymentDay != null" class="m">납부일 <strong class="numeric">매월 {{ t.paymentDay }}일</strong></span>
        </div>

        <div
          v-if="t.rentStatus && t.rentStatus.state !== 'NO_RENT'"
          class="rent"
          :class="t.rentStatus?.state.toLowerCase()"
        >
          <span class="rent-label">
            <template v-if="t.rentStatus.state === 'OVERDUE'">
              ⚠ 월세 연체 {{ t.rentStatus.overdueMonths }}개월 (최종납부 {{ t.rentStatus.lastPaidMonth }})
            </template>
            <template v-else-if="t.rentStatus.state === 'PAID'">
              월세 납부 완료 ({{ t.rentStatus.lastPaidMonth }})
            </template>
            <template v-else>월세 납부 정보 없음</template>
          </span>
          <button
            v-if="t.rentStatus.state === 'PAID'"
            class="rent-btn"
            type="button"
            @click="markUnpaid(t)"
          >
            납부 취소
          </button>
          <button v-else class="rent-btn pay" type="button" @click="markPaid(t)">
            {{ t.rentStatus.dueMonth }} 납부 처리
          </button>
        </div>

        <div v-if="t.leaseStart || t.leaseEnd" class="lease">
          계약기간 {{ t.leaseStart || '?' }} ~ {{ t.leaseEnd || '?' }}
        </div>
        <p v-if="t.contact" class="contact">{{ t.contact }}</p>
        <p v-if="t.specialTerms" class="terms">{{ t.specialTerms }}</p>

        <button class="card-del" type="button" @click="askDelete(t)">임차인 삭제</button>
      </article>
    </div>

    <ConfirmDialog
      :open="!!pendingDelete"
      title="임차인을 삭제할까요?"
      :busy="deleting"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    >
      <strong>{{ pendingDelete?.name }}</strong> 임차인을 삭제하면 계약·월세 납부 정보 등
      이 임차인과 관련된 정보가 모두 삭제되며, 되돌릴 수 없습니다.
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
.ctx {
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--paper-sunk);
  border: 1px solid var(--slate-200);
  border-radius: var(--r-input);
  padding: 10px 12px;
}
.ctx-addr {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.ctx-name {
  font-size: 12px;
  color: var(--ink-3);
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
.badge {
  margin-left: auto;
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
.contact {
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
/* L-04 월세 연체 강조 */
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
