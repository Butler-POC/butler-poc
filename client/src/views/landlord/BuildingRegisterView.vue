<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useBuildingsStore } from '@/stores/buildings';
import { parseRegistry } from '@/api/buildings';
import type { Mortgage, RegistryFields } from '@/types/building';
import { checkUploadSize } from '@/lib/upload';

const router = useRouter();
const store = useBuildingsStore();

type Mode = 'ocr' | 'manual';
const mode = ref<Mode>('ocr');

const form = reactive<RegistryFields>({
  address: '',
  buildingName: '',
  structure: '',
  usage: '',
  totalFloorArea: null,
  floors: '',
  ownerName: '',
  ownerShare: '',
  registryNo: '',
  mortgages: [],
});

const fileInput = ref<HTMLInputElement | null>(null);
const parsing = ref(false);
const parsed = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

function setMode(m: Mode) {
  mode.value = m;
  error.value = null;
}

function pickFile() {
  if (!parsing.value) fileInput.value?.click();
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
    const { fields } = await parseRegistry(file);
    form.address = fields.address ?? '';
    form.buildingName = fields.buildingName ?? '';
    form.structure = fields.structure ?? '';
    form.usage = fields.usage ?? '';
    form.totalFloorArea = fields.totalFloorArea ?? null;
    form.floors = fields.floors ?? '';
    form.ownerName = fields.ownerName ?? '';
    form.ownerShare = fields.ownerShare ?? '';
    form.registryNo = fields.registryNo ?? '';
    form.mortgages = fields.mortgages ?? [];
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

function addMortgage() {
  form.mortgages.push({
    maxClaimAmount: null,
    creditor: '',
    debtor: '',
    establishedOn: '',
  });
}

function removeMortgage(i: number) {
  form.mortgages.splice(i, 1);
}

async function save() {
  if (saving.value) return;
  if (!form.address?.trim()) {
    error.value = '소재지(주소)는 필수입니다.';
    return;
  }
  saving.value = true;
  error.value = null;
  try {
    await store.add({
      address: form.address.trim(),
      buildingName: form.buildingName,
      structure: form.structure,
      usage: form.usage,
      totalFloorArea: form.totalFloorArea,
      floors: form.floors,
      ownerName: form.ownerName,
      ownerShare: form.ownerShare,
      registryNo: form.registryNo,
      mortgages: form.mortgages as Mortgage[],
      source: parsed.value ? 'ocr' : 'manual',
    });
    router.push('/app/landlord/buildings');
  } catch (e: any) {
    error.value = e?.response?.data?.error ?? '저장에 실패했습니다. 다시 시도해 주세요.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="view">
    <RouterLink class="back" to="/app/landlord/buildings">← 목록으로</RouterLink>

    <header class="head">
      <p class="eyebrow">임대인</p>
      <h1 class="title">내 건물 등록</h1>
      <p class="desc">등기사항증명서를 스캔하면 정보를 자동으로 채웁니다. 직접 입력도 가능합니다.</p>
    </header>

    <div class="segmented">
      <button type="button" class="seg" :class="{ active: mode === 'ocr' }" @click="setMode('ocr')">
        등기부 스캔
      </button>
      <button type="button" class="seg" :class="{ active: mode === 'manual' }" @click="setMode('manual')">
        직접 입력
      </button>
    </div>

    <div v-if="mode === 'ocr'" class="dropzone" :class="{ busy: parsing }" @click="pickFile">
      <input ref="fileInput" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*" hidden @change="onFile" />
      <template v-if="parsing">
        <p class="dz-title">분석 중…</p>
        <p class="dz-sub">문서에서 정보를 추출하고 있습니다</p>
      </template>
      <template v-else-if="parsed">
        <p class="dz-title">추출 완료 — 아래에서 확인·수정하세요</p>
        <p class="dz-sub">다른 파일로 다시 스캔하려면 누르세요</p>
      </template>
      <template v-else>
        <p class="dz-title">등기사항증명서를 끌어다 놓거나 눌러서 선택</p>
        <p class="dz-sub">PDF 최대 20MB · 이미지 최대 7.5MB</p>
      </template>
    </div>

    <div v-if="parsed" class="parsed-note">
      말소(밑줄)된 항목은 제외하고 현재 유효한 정보만 추출했습니다. 값을 확인해 주세요.
    </div>

    <form class="form" @submit.prevent="save">
      <div class="field">
        <label class="label" for="address">소재지 *</label>
        <input id="address" v-model="form.address" class="input" type="text" placeholder="서울특별시 ○○구 ○○로 12" />
      </div>

      <div class="row">
        <div class="field">
          <label class="label" for="bname">건물 명칭</label>
          <input id="bname" v-model="form.buildingName" class="input" type="text" placeholder="○○빌딩" />
        </div>
        <div class="field">
          <label class="label" for="usage">용도</label>
          <input id="usage" v-model="form.usage" class="input" type="text" placeholder="공동주택" />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label" for="structure">구조</label>
          <input id="structure" v-model="form.structure" class="input" type="text" placeholder="철근콘크리트구조" />
        </div>
        <div class="field">
          <label class="label" for="area">연면적(㎡)</label>
          <input id="area" v-model.number="form.totalFloorArea" class="input" type="number" step="0.01" placeholder="327.5" />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label" for="floors">층수</label>
          <input id="floors" v-model="form.floors" class="input" type="text" placeholder="지상5층/지하1층" />
        </div>
        <div class="field">
          <label class="label" for="regno">등기 고유번호</label>
          <input id="regno" v-model="form.registryNo" class="input" type="text" placeholder="1234-2026-000000" />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label" for="owner">소유자</label>
          <input id="owner" v-model="form.ownerName" class="input" type="text" placeholder="홍길동" />
        </div>
        <div class="field">
          <label class="label" for="share">지분</label>
          <input id="share" v-model="form.ownerShare" class="input" type="text" placeholder="1/1" />
        </div>
      </div>

      <!-- 근저당권 (을구) -->
      <div class="mort">
        <div class="mort-head">
          <span class="label">근저당권 (을구)</span>
          <button type="button" class="add-m" @click="addMortgage">＋ 추가</button>
        </div>

        <p v-if="form.mortgages.length === 0" class="mort-empty">
          설정된 근저당권이 없습니다.
        </p>

        <div v-for="(m, i) in form.mortgages" :key="i" class="mort-row">
          <div class="mort-grid">
            <div class="field">
              <label class="label sm">채권최고액(원)</label>
              <input v-model.number="m.maxClaimAmount" class="input" type="number" placeholder="240000000" />
            </div>
            <div class="field">
              <label class="label sm">근저당권자</label>
              <input v-model="m.creditor" class="input" type="text" placeholder="○○은행" />
            </div>
            <div class="field">
              <label class="label sm">채무자</label>
              <input v-model="m.debtor" class="input" type="text" placeholder="홍길동" />
            </div>
            <div class="field">
              <label class="label sm">설정일</label>
              <input v-model="m.establishedOn" class="input" type="text" placeholder="2024-03-15" />
            </div>
          </div>
          <button type="button" class="del-m" title="삭제" @click="removeMortgage(i)">✕</button>
        </div>
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <button class="btn primary" type="submit" :disabled="saving || parsing">
        {{ saving ? '저장 중…' : '건물 등록' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  padding: 28px 20px;
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
  gap: 14px;
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
.label.sm {
  font-size: 11px;
  color: var(--ink-3);
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
/* 근저당권 */
.mort {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-top: 1px solid var(--slate-100);
  padding-top: 16px;
}
.mort-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.add-m {
  appearance: none;
  border: 1px solid var(--slate-200);
  background: var(--paper);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  padding: 5px 12px;
  border-radius: var(--r-pill);
  cursor: pointer;
}
.mort-empty {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
}
.mort-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  background: var(--paper-sunk);
  border: 1px solid var(--slate-200);
  border-radius: var(--r-input);
  padding: 12px;
}
.mort-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  min-width: 0;
}
.del-m {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ink-4);
  font-size: 14px;
  cursor: pointer;
  padding: 2px 4px;
}
.del-m:hover {
  color: var(--crimson);
}
.error {
  font-size: 13px;
  color: var(--crimson);
  background: var(--crimson-soft);
  border-radius: var(--r-input);
  padding: 10px 12px;
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
  background: var(--ink);
  color: var(--paper);
}
.btn:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
