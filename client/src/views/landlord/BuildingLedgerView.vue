<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useBuildingsStore } from '@/stores/buildings';
import { parseLedger } from '@/api/buildings';
import type { LedgerFields } from '@/types/building';
import { checkUploadSize } from '@/lib/upload';

const route = useRoute();
const router = useRouter();
const store = useBuildingsStore();
const { items } = storeToRefs(store);

const buildingId = route.params.id as string;

type Mode = 'ocr' | 'manual';
const mode = ref<Mode>('ocr');

const form = reactive<LedgerFields>({
  siteAddress: '',
  lotNumber: '',
  buildingName: '',
  landArea: null,
  buildingArea: null,
  totalFloorArea: null,
  buildingCoverageRatio: null,
  floorAreaRatio: null,
  mainStructure: '',
  mainUsage: '',
  floorsAbove: null,
  floorsBelow: null,
  height: null,
  households: '',
  parking: '',
  approvalDate: '',
});

const fileInput = ref<HTMLInputElement | null>(null);
const parsing = ref(false);
const parsed = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);

const building = computed(() => items.value.find((b) => b.id === buildingId) ?? null);
const isEdit = ref(false);

onMounted(async () => {
  if (!store.loaded) await store.fetch();
  const b = building.value;
  if (b?.ledger) {
    // 기존 건축물대장 → 수정 모드로 미리 채움
    fillForm(b.ledger);
    isEdit.value = true;
    mode.value = 'manual';
  } else if (b && !form.siteAddress) {
    // 신규 → 등기부 주소를 대지위치 기본값으로
    form.siteAddress = b.address ?? '';
    form.buildingName = b.buildingName ?? '';
  }
});

function fillForm(f: Partial<LedgerFields>) {
  form.siteAddress = f.siteAddress ?? '';
  form.lotNumber = f.lotNumber ?? '';
  form.buildingName = f.buildingName ?? '';
  form.landArea = f.landArea ?? null;
  form.buildingArea = f.buildingArea ?? null;
  form.totalFloorArea = f.totalFloorArea ?? null;
  form.buildingCoverageRatio = f.buildingCoverageRatio ?? null;
  form.floorAreaRatio = f.floorAreaRatio ?? null;
  form.mainStructure = f.mainStructure ?? '';
  form.mainUsage = f.mainUsage ?? '';
  form.floorsAbove = f.floorsAbove ?? null;
  form.floorsBelow = f.floorsBelow ?? null;
  form.height = f.height ?? null;
  form.households = f.households ?? '';
  form.parking = f.parking ?? '';
  form.approvalDate = f.approvalDate ?? '';
}

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
    const { fields } = await parseLedger(file);
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
  saving.value = true;
  error.value = null;
  try {
    await store.saveLedger(buildingId, {
      ...form,
      source: parsed.value ? 'ocr' : 'manual',
    });
    router.push(`/app/landlord/buildings/${buildingId}`);
  } catch (e: any) {
    error.value =
      e?.response?.data?.error ?? '저장에 실패했습니다. 다시 시도해 주세요.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="view">
    <RouterLink class="back" :to="`/app/landlord/buildings/${buildingId}`">← 건물 상세로</RouterLink>

    <header class="head">
      <p class="eyebrow">임대인</p>
      <h1 class="title">{{ isEdit ? '건축물대장 수정' : '내 건물 정보 등록' }}</h1>
      <p class="desc">건축물대장을 스캔하면 정보를 자동으로 채웁니다. 직접 입력도 가능합니다.</p>
      <p v-if="building" class="ctx">
        <span class="ctx-addr">{{ building.address }}</span>
        <span v-if="building.buildingName" class="ctx-name">{{ building.buildingName }}</span>
      </p>
    </header>

    <div class="segmented">
      <button type="button" class="seg" :class="{ active: mode === 'ocr' }" @click="setMode('ocr')">
        대장 스캔
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
        <p class="dz-title">건축물대장을 끌어다 놓거나 눌러서 선택</p>
        <p class="dz-sub">PDF 최대 20MB · 이미지 최대 7.5MB</p>
      </template>
    </div>

    <div v-if="parsed" class="parsed-note">
      추출된 값을 확인해 주세요. 일부 항목은 문서 품질에 따라 비어 있을 수 있습니다.
    </div>

    <form class="form" @submit.prevent="save">
      <div class="field">
        <label class="label" for="site">대지위치</label>
        <input id="site" v-model="form.siteAddress" class="input" type="text" placeholder="서울특별시 ○○구 ○○로 12" />
      </div>

      <div class="row">
        <div class="field">
          <label class="label" for="lot">지번</label>
          <input id="lot" v-model="form.lotNumber" class="input" type="text" placeholder="123-4" />
        </div>
        <div class="field">
          <label class="label" for="lname">건축물 명칭</label>
          <input id="lname" v-model="form.buildingName" class="input" type="text" placeholder="○○빌딩" />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label" for="larea">대지면적(㎡)</label>
          <input id="larea" v-model.number="form.landArea" class="input" type="number" step="0.01" placeholder="200" />
        </div>
        <div class="field">
          <label class="label" for="barea">건축면적(㎡)</label>
          <input id="barea" v-model.number="form.buildingArea" class="input" type="number" step="0.01" placeholder="120" />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label" for="tarea">연면적(㎡)</label>
          <input id="tarea" v-model.number="form.totalFloorArea" class="input" type="number" step="0.01" placeholder="327.5" />
        </div>
        <div class="field">
          <label class="label" for="height">높이(m)</label>
          <input id="height" v-model.number="form.height" class="input" type="number" step="0.01" placeholder="18.5" />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label" for="bcr">건폐율(%)</label>
          <input id="bcr" v-model.number="form.buildingCoverageRatio" class="input" type="number" step="0.01" placeholder="59.8" />
        </div>
        <div class="field">
          <label class="label" for="far">용적률(%)</label>
          <input id="far" v-model.number="form.floorAreaRatio" class="input" type="number" step="0.01" placeholder="163.7" />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label" for="struct">주구조</label>
          <input id="struct" v-model="form.mainStructure" class="input" type="text" placeholder="철근콘크리트구조" />
        </div>
        <div class="field">
          <label class="label" for="muse">주용도</label>
          <input id="muse" v-model="form.mainUsage" class="input" type="text" placeholder="공동주택" />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label" for="fa">지상 층수</label>
          <input id="fa" v-model.number="form.floorsAbove" class="input" type="number" placeholder="5" />
        </div>
        <div class="field">
          <label class="label" for="fb">지하 층수</label>
          <input id="fb" v-model.number="form.floorsBelow" class="input" type="number" placeholder="1" />
        </div>
      </div>

      <div class="row">
        <div class="field">
          <label class="label" for="house">세대/가구/호</label>
          <input id="house" v-model="form.households" class="input" type="text" placeholder="12세대" />
        </div>
        <div class="field">
          <label class="label" for="park">주차</label>
          <input id="park" v-model="form.parking" class="input" type="text" placeholder="10대" />
        </div>
      </div>

      <div class="field">
        <label class="label" for="approval">사용승인일</label>
        <input id="approval" v-model="form.approvalDate" class="input" type="text" placeholder="2018-04-20" />
      </div>

      <div v-if="error" class="error">{{ error }}</div>

      <button class="btn primary" type="submit" :disabled="saving || parsing">
        {{ saving ? '저장 중…' : isEdit ? '건축물대장 수정' : '건축물대장 등록' }}
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
.ctx {
  margin: 6px 0 0;
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
