<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { scanDocument, ocrHealth, type OcrCategory, type OcrResponse } from '@/api/ocr';
import { checkUploadSize } from '@/lib/upload';

const CATEGORIES: { value: OcrCategory; label: string }[] = [
  { value: 'registry', label: '등기부등본' },
  { value: 'contracts', label: '임대차계약서' },
  { value: 'buildings', label: '건축물대장' },
  { value: 'misc', label: '기타' },
];

const ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.gif,application/pdf,image/*';

const category = ref<OcrCategory>('registry');
const file = ref<File | null>(null);
const dragOver = ref(false);
const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<OcrResponse | null>(null);
const copied = ref(false);
const visionEnabled = ref(true);

const fileInput = ref<HTMLInputElement | null>(null);

onMounted(async () => {
  try {
    const h = await ocrHealth();
    visionEnabled.value = h.visionEnabled;
  } catch {
    /* 서버 미기동 시 무시 — 추출 시도에서 오류로 안내된다 */
  }
});

const fileMeta = computed(() => {
  if (!file.value) return null;
  return {
    name: file.value.name,
    size: formatBytes(file.value.size),
    isImage: file.value.type.startsWith('image/'),
  };
});

const sourceLabel = computed(() => {
  if (!result.value) return '';
  return result.value.source === 'pdf-text'
    ? '직접 추출 (텍스트 PDF)'
    : `LLM 비전 (${result.value.provider ?? ''})`;
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function pickFile() {
  fileInput.value?.click();
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  setFile(target.files?.[0] ?? null);
}

function onDrop(e: DragEvent) {
  dragOver.value = false;
  setFile(e.dataTransfer?.files?.[0] ?? null);
}

function setFile(f: File | null) {
  error.value = null;
  result.value = null;
  if (!f) return;
  const sizeError = checkUploadSize(f);
  if (sizeError) {
    error.value = sizeError;
    return;
  }
  file.value = f;
}

function reset() {
  file.value = null;
  result.value = null;
  error.value = null;
  if (fileInput.value) fileInput.value.value = '';
}

async function runScan() {
  if (!file.value || loading.value) return;
  loading.value = true;
  error.value = null;
  result.value = null;
  try {
    result.value = await scanDocument(file.value, category.value);
  } catch (e: any) {
    error.value =
      e?.response?.data?.error ??
      e?.message ??
      '텍스트 추출에 실패했습니다. 다시 시도해 주세요.';
  } finally {
    loading.value = false;
  }
}

async function copyText() {
  if (!result.value) return;
  await navigator.clipboard.writeText(result.value.text);
  copied.value = true;
  window.setTimeout(() => (copied.value = false), 1600);
}
</script>

<template>
  <section class="scanner">
    <!-- 카테고리 선택 -->
    <div class="field">
      <label class="label">문서 종류</label>
      <div class="segmented" role="tablist">
        <button
          v-for="c in CATEGORIES"
          :key="c.value"
          type="button"
          class="seg"
          :class="{ active: category === c.value }"
          @click="category = c.value"
        >
          {{ c.label }}
        </button>
      </div>
    </div>

    <!-- 드롭존 -->
    <div
      class="dropzone"
      :class="{ over: dragOver, hasfile: !!file }"
      @click="pickFile"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="ACCEPT"
        hidden
        @change="onFileChange"
      />
      <template v-if="!fileMeta">
        <p class="dz-title">문서를 끌어다 놓거나 눌러서 선택</p>
        <p class="dz-sub">PDF 최대 20MB · 이미지 최대 7.5MB</p>
      </template>
      <template v-else>
        <p class="dz-file">{{ fileMeta.name }}</p>
        <p class="dz-sub">{{ fileMeta.size }}</p>
      </template>
    </div>

    <!-- 비전 비활성 안내 -->
    <div v-if="!visionEnabled" class="banner amber">
      <strong>이미지·스캔본은 처리할 수 없습니다.</strong>
      <span>서버 .env 의 API_KEY 를 설정하면 LLM 비전이 활성화됩니다. 텍스트 레이어가 있는 PDF는 키 없이 추출됩니다.</span>
    </div>

    <!-- 액션 -->
    <div class="actions">
      <button class="btn primary" :disabled="!file || loading" @click="runScan">
        {{ loading ? '추출 중…' : '텍스트 추출' }}
      </button>
      <button v-if="file" class="btn ghost" :disabled="loading" @click="reset">
        초기화
      </button>
    </div>

    <!-- 오류 -->
    <div v-if="error" class="banner crimson">
      <strong>추출 실패</strong>
      <span>{{ error }}</span>
    </div>

    <!-- 결과 -->
    <div v-if="result" class="result">
      <div class="result-head">
        <span class="badge" :class="result.source">{{ sourceLabel }}</span>
        <span class="charcount numeric">{{ result.charCount.toLocaleString() }}자</span>
        <button class="btn ghost sm copy" @click="copyText">
          {{ copied ? '복사됨 ✓' : '복사' }}
        </button>
      </div>
      <pre class="text">{{ result.text }}</pre>
    </div>
  </section>
</template>

<style scoped>
.scanner {
  display: flex;
  flex-direction: column;
  gap: 20px;
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

/* segmented control */
.segmented {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.seg {
  appearance: none;
  border: 1px solid var(--slate-200);
  background: var(--paper);
  color: var(--ink-2);
  border-radius: var(--r-pill);
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--d-base) var(--ease-out);
}

.seg.active {
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}

/* dropzone */
.dropzone {
  border: 1.5px dashed var(--slate-300);
  border-radius: var(--r-card);
  background: var(--paper-sunk);
  padding: 36px 20px;
  text-align: center;
  cursor: pointer;
  transition: all var(--d-base) var(--ease-out);
}

.dropzone.over {
  border-color: var(--brass);
  background: var(--brass-soft);
}

.dropzone.hasfile {
  border-style: solid;
  border-color: var(--slate-200);
  background: var(--paper-raised);
}

.dz-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
}

.dz-file {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink);
  word-break: break-all;
}

.dz-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--ink-3);
}

/* buttons */
.actions {
  display: flex;
  gap: 10px;
}

.btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: var(--r-pill);
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all var(--d-base) var(--ease-out);
}

.btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.btn.primary {
  background: var(--ink);
  color: var(--paper);
}

.btn.ghost {
  background: transparent;
  color: var(--ink-2);
}

.btn.ghost:hover:not(:disabled) {
  background: var(--paper-sunk);
}

.btn.sm {
  padding: 6px 12px;
  font-size: 12px;
}

/* banners */
.banner {
  display: flex;
  flex-direction: column;
  gap: 3px;
  border-radius: var(--r-card);
  padding: 14px 16px;
  font-size: 13px;
}

.banner strong {
  font-size: 14px;
}

.banner.amber {
  background: var(--amber-soft);
  border: 1px solid var(--amber);
  color: var(--brass-ink);
}

.banner.crimson {
  background: var(--crimson-soft);
  border: 1px solid var(--crimson);
  color: var(--crimson);
}

/* result */
.result {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--paper-raised);
  border: 1px solid var(--slate-100);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-1);
  padding: 18px;
}

.result-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 4px 10px;
  border-radius: var(--r-pill);
}

.badge.pdf-text {
  background: var(--sage-soft);
  color: var(--sage);
}

.badge.vision {
  background: var(--brass-soft);
  color: var(--brass-ink);
}

.charcount {
  font-size: 12px;
  color: var(--ink-3);
}

.copy {
  margin-left: auto;
}

.text {
  margin: 0;
  max-height: 460px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink);
  background: var(--paper-sunk);
  border-radius: var(--r-input);
  padding: 14px;
}
</style>
