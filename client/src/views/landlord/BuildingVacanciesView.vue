<script setup lang="ts">
// L-07 공실 등록 — 단독 페이지. 드로어에서 진입 → 내 건물 중 하나를 선택해 공실을 등록한다.
// (건물별 종속 제거: buildingId 는 라우트 파라미터가 아니라 화면 내 선택값)
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useBuildingsStore } from '@/stores/buildings';
import {
  listVacancies,
  createVacancy,
  updateVacancy,
  deleteVacancy,
  type DealType,
  type Vacancy,
  type VacancyPayload,
} from '@/api/vacancies';
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue';

const route = useRoute();
const store = useBuildingsStore();
const { items } = storeToRefs(store);

const ready = ref(false); // 건물 목록 로드 완료
const selectedId = ref<string | null>(null);
const selectedBuilding = computed(
  () => items.value.find((b) => b.id === selectedId.value) ?? null,
);

const vacancies = ref<Vacancy[]>([]);
const loadingList = ref(false);
const adding = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

const emptyForm = (): VacancyPayload => ({
  unit: '',
  dealType: 'MONTHLY',
  deposit: null,
  monthlyRent: null,
  maintenanceFee: null,
  areaM2: null,
  floor: '',
  roomType: '',
  availableFrom: '',
  description: '',
  contact: '',
});
const form = reactive<VacancyPayload>(emptyForm());

onMounted(async () => {
  if (!store.loaded) await store.fetch();
  ready.value = true;

  // 초기 선택: ?buildingId= 우선 → 건물이 하나뿐이면 자동 선택
  const q = route.query.buildingId;
  if (typeof q === 'string' && items.value.some((b) => b.id === q)) {
    selectedId.value = q;
  } else if (items.value.length === 1) {
    selectedId.value = items.value[0].id;
  }

  // 메인화면 "공실로 등록"에서 동/호를 넘겨받으면 추가 폼을 열고 미리 채움
  const unit = route.query.unit;
  if (typeof unit === 'string' && unit && selectedId.value) {
    openAdd();
    form.unit = unit;
  }
});

// 선택 건물이 바뀌면 해당 건물의 공실을 다시 불러온다
watch(selectedId, (id) => {
  vacancies.value = [];
  if (id) loadVacancies(id);
});

async function loadVacancies(id: string) {
  loadingList.value = true;
  error.value = null;
  try {
    vacancies.value = await listVacancies(id);
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '공실 목록을 불러오지 못했습니다.';
  } finally {
    loadingList.value = false;
  }
}

// 사용자가 건물을 직접 바꾸면 작성 중인 폼은 닫는다
function onBuildingChange() {
  adding.value = false;
  error.value = null;
}

function openAdd() {
  Object.assign(form, emptyForm());
  error.value = null;
  adding.value = true;
}

function cancelAdd() {
  adding.value = false;
  error.value = null;
}

async function save() {
  if (saving.value) return;
  if (!selectedId.value) {
    error.value = '먼저 건물을 선택해 주세요.';
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    const created = await createVacancy(selectedId.value, { ...form, status: 'OPEN' });
    vacancies.value.unshift(created);
    const b = selectedBuilding.value;
    if (b) {
      b._count = {
        tenants: b._count?.tenants ?? 0,
        vacancies: (b._count?.vacancies ?? 0) + 1,
      };
    }
    adding.value = false;
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '저장에 실패했습니다. 다시 시도해 주세요.';
  } finally {
    saving.value = false;
  }
}

async function toggleStatus(v: Vacancy) {
  if (!selectedId.value) return;
  const next = v.status === 'OPEN' ? 'CLOSED' : 'OPEN';
  try {
    const updated = await updateVacancy(selectedId.value, v.id, { status: next });
    const i = vacancies.value.findIndex((x) => x.id === v.id);
    if (i !== -1) vacancies.value[i] = updated;
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '상태 변경에 실패했습니다.';
  }
}

const pendingDelete = ref<Vacancy | null>(null);
const deleting = ref(false);

function askDelete(v: Vacancy) {
  pendingDelete.value = v;
}

async function confirmDelete() {
  const v = pendingDelete.value;
  if (!v || !selectedId.value || deleting.value) return;
  deleting.value = true;
  error.value = null;
  try {
    await deleteVacancy(selectedId.value, v.id);
    vacancies.value = vacancies.value.filter((x) => x.id !== v.id);
    const b = selectedBuilding.value;
    if (b) {
      b._count = {
        tenants: b._count?.tenants ?? 0,
        vacancies: Math.max(0, (b._count?.vacancies ?? 1) - 1),
      };
    }
    pendingDelete.value = null;
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '삭제에 실패했습니다.';
  } finally {
    deleting.value = false;
  }
}

const DEAL_LABEL: Record<DealType, string> = { MONTHLY: '월세', JEONSE: '전세' };

function won(v: number | null): string {
  return v == null ? '' : `₩${v.toLocaleString()}`;
}

function priceLine(v: Vacancy): string {
  if (v.dealType === 'JEONSE') return `전세 ${won(v.deposit)}`;
  const dep = v.deposit != null ? won(v.deposit) : '0';
  const rent = v.monthlyRent != null ? won(v.monthlyRent) : '0';
  return `월세 ${dep} / ${rent}`;
}

function buildingLabel(b: { address: string | null; buildingName?: string | null }): string {
  const addr = b.address ?? '주소 미상';
  return b.buildingName ? `${addr} (${b.buildingName})` : addr;
}
</script>

<template>
  <div class="view">
    <RouterLink class="back" to="/app/landlord">← 홈으로</RouterLink>

    <header class="head">
      <p class="eyebrow">임대인</p>
      <h1 class="title">공실 등록</h1>
      <p class="desc">등록한 건물을 선택해 공실(빈 집)을 매물로 등록합니다.</p>
    </header>

    <!-- 건물 미등록 -->
    <p v-if="ready && items.length === 0" class="empty">
      먼저 내 건물을 등록해 주세요.
      <RouterLink class="empty-link" to="/app/landlord/buildings/new">＋ 새 건물 등록</RouterLink>
    </p>

    <template v-else>
      <!-- 건물 선택 -->
      <div class="field selector">
        <label class="label">건물 선택</label>
        <select v-model="selectedId" class="input" @change="onBuildingChange">
          <option :value="null" disabled>건물을 선택하세요</option>
          <option v-for="b in items" :key="b.id" :value="b.id">{{ buildingLabel(b) }}</option>
        </select>
      </div>

      <p v-if="!selectedId" class="hint">건물을 선택하면 공실을 등록할 수 있습니다.</p>

      <template v-else>
        <button v-if="!adding" class="add" type="button" @click="openAdd">＋ 공실 등록</button>

        <!-- 등록 폼 -->
        <section v-if="adding" class="panel">
          <div class="row">
            <div class="field">
              <label class="label">동/호</label>
              <input v-model="form.unit" class="input" type="text" placeholder="101동 502호" />
            </div>
            <div class="field">
              <label class="label">거래 유형</label>
              <select v-model="form.dealType" class="input">
                <option value="MONTHLY">월세</option>
                <option value="JEONSE">전세</option>
              </select>
            </div>
          </div>

          <div class="row">
            <div class="field">
              <label class="label">보증금(원)</label>
              <input v-model.number="form.deposit" class="input" type="number" placeholder="50000000" />
            </div>
            <div class="field">
              <label class="label">월세(원)</label>
              <input
                v-model.number="form.monthlyRent"
                class="input"
                type="number"
                placeholder="800000"
                :disabled="form.dealType === 'JEONSE'"
              />
            </div>
          </div>

          <div class="row">
            <div class="field">
              <label class="label">관리비(원)</label>
              <input v-model.number="form.maintenanceFee" class="input" type="number" placeholder="70000" />
            </div>
            <div class="field">
              <label class="label">전용면적(㎡)</label>
              <input v-model.number="form.areaM2" class="input" type="number" step="0.01" placeholder="59.8" />
            </div>
          </div>

          <div class="row">
            <div class="field">
              <label class="label">층</label>
              <input v-model="form.floor" class="input" type="text" placeholder="5층" />
            </div>
            <div class="field">
              <label class="label">구조</label>
              <input v-model="form.roomType" class="input" type="text" placeholder="투룸/주방분리" />
            </div>
          </div>

          <div class="row">
            <div class="field">
              <label class="label">입주 가능일</label>
              <input v-model="form.availableFrom" class="input" type="text" placeholder="2026-07-01 / 즉시" />
            </div>
            <div class="field">
              <label class="label">문의 연락처</label>
              <input v-model="form.contact" class="input" type="text" placeholder="010-1234-5678" />
            </div>
          </div>

          <div class="field">
            <label class="label">상세 설명</label>
            <textarea v-model="form.description" class="input area" rows="3" placeholder="채광·옵션·역세권 등 매물 소개" />
          </div>

          <div v-if="error" class="error">{{ error }}</div>

          <div class="actions">
            <button class="btn primary" type="button" :disabled="saving" @click="save">
              {{ saving ? '저장 중…' : '공실 등록' }}
            </button>
            <button class="btn ghost" type="button" :disabled="saving" @click="cancelAdd">취소</button>
          </div>
        </section>

        <!-- 목록 -->
        <p v-if="loadingList" class="empty">불러오는 중…</p>
        <p v-else-if="vacancies.length === 0 && !adding" class="empty">
          이 건물에 등록된 공실이 없습니다.
        </p>

        <div v-if="vacancies.length" class="list">
          <article v-for="v in vacancies" :key="v.id" class="card" :class="{ closed: v.status === 'CLOSED' }">
            <div class="card-top">
              <span class="deal">{{ DEAL_LABEL[v.dealType] }}</span>
              <span v-if="v.unit" class="unit">{{ v.unit }}</span>
              <span class="status" :class="v.status.toLowerCase()">
                {{ v.status === 'OPEN' ? '모집중' : '마감' }}
              </span>
            </div>

            <p class="price numeric">{{ priceLine(v) }}</p>

            <div class="chips">
              <span v-if="v.areaM2 != null" class="chip numeric">{{ v.areaM2 }}㎡</span>
              <span v-if="v.floor" class="chip">{{ v.floor }}</span>
              <span v-if="v.roomType" class="chip">{{ v.roomType }}</span>
              <span v-if="v.maintenanceFee != null" class="chip numeric">관리비 {{ won(v.maintenanceFee) }}</span>
            </div>

            <p v-if="v.availableFrom" class="meta">입주 가능 {{ v.availableFrom }}</p>
            <p v-if="v.contact" class="meta">문의 {{ v.contact }}</p>
            <p v-if="v.description" class="desc-text">{{ v.description }}</p>

            <div class="card-actions">
              <button class="toggle" type="button" @click="toggleStatus(v)">
                {{ v.status === 'OPEN' ? '마감으로 변경' : '다시 모집' }}
              </button>
              <button class="vac-del" type="button" @click="askDelete(v)">삭제</button>
            </div>
          </article>
        </div>
      </template>
    </template>

    <ConfirmDialog
      :open="!!pendingDelete"
      title="공실을 삭제할까요?"
      :busy="deleting"
      @confirm="confirmDelete"
      @cancel="pendingDelete = null"
    >
      이 공실 매물을 삭제하면 <strong>등록된 매물 정보가 모두 삭제</strong>되며,
      되돌릴 수 없습니다.
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
  font-size: 13px;
  color: var(--ink-3);
}
.selector {
  background: var(--paper-raised);
  border: 1px solid var(--slate-100);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-1);
  padding: 14px 16px;
}
.hint {
  margin: 4px 0;
  text-align: center;
  font-size: 13px;
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
  gap: 12px;
  background: var(--paper-raised);
  border: 1px solid var(--slate-100);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-1);
  padding: 16px;
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
.input:disabled {
  background: var(--paper-sunk);
  color: var(--ink-4);
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.empty-link {
  text-decoration: none;
  background: var(--ink);
  color: var(--paper);
  font-size: 13px;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: var(--r-pill);
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
.card.closed {
  opacity: 0.62;
}
.card-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.deal {
  font-size: 12px;
  font-weight: 700;
  color: var(--brass-ink);
  background: var(--brass-soft);
  padding: 3px 9px;
  border-radius: var(--r-pill);
}
.unit {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
.status {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: var(--r-pill);
}
.status.open {
  background: var(--sage-soft);
  color: var(--sage);
}
.status.closed {
  background: var(--paper-sunk);
  color: var(--ink-3);
  border: 1px solid var(--slate-200);
}
.price {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
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
.meta {
  margin: 0;
  font-size: 12px;
  color: var(--ink-3);
}
.desc-text {
  margin: 0;
  font-size: 13px;
  color: var(--ink-2);
  white-space: pre-wrap;
  background: var(--paper-sunk);
  border-radius: var(--r-input);
  padding: 8px 10px;
}
.card-actions {
  display: flex;
  gap: 8px;
}
.toggle {
  appearance: none;
  border: 1px solid var(--slate-200);
  background: var(--paper);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  padding: 6px 12px;
  border-radius: var(--r-pill);
  cursor: pointer;
}
.vac-del {
  appearance: none;
  border: 1px solid var(--crimson);
  background: var(--crimson-soft);
  color: var(--crimson);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  padding: 6px 12px;
  border-radius: var(--r-pill);
  cursor: pointer;
}
.vac-del:active {
  opacity: 0.8;
}
</style>
