<!-- T-02 하자 상담 (테넌트) -->
<!-- 임대인 연락 전, 임차 건물·특약 기반으로 하자를 상담. 상담 응답 + 예상 수선비율 안내. -->
<!-- ⚠️ AI 출력은 참고용 · 법적 효력 없음 — 디스클레이머 상시 노출. 가정(기반): @/api/client -->
<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { repairChat, type RepairChatResult } from '@/api/issues';
import type { IssueCategory, RepairRateAssessment } from '@/types';
import BackHome from '@/components/layout/BackHome.vue';

type Msg = { role: 'user' | 'assistant'; content: string };

const CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: 'plumbing', label: '수도/하수' },
  { value: 'electrical', label: '전기' },
  { value: 'boiler', label: '보일러/난방' },
  { value: 'waterproof', label: '누수/방수' },
  { value: 'interior', label: '내부 마감' },
  { value: 'appliance', label: '빌트인 가전' },
  { value: 'other', label: '기타' },
];
const DISCLAIMER = '참고용 · 법적 효력 없음';

const router = useRouter();
const category = ref<IssueCategory>('plumbing');
const messages = ref<Msg[]>([]);
const draft = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const assessment = ref<RepairRateAssessment | null>(null);
const lastDescription = ref('');
const threadEl = ref<HTMLElement | null>(null);

async function scrollToEnd() {
  await nextTick();
  if (threadEl.value) threadEl.value.scrollTop = threadEl.value.scrollHeight;
}

async function send() {
  const text = draft.value.trim();
  if (!text || loading.value) return;
  draft.value = '';
  error.value = null;
  lastDescription.value = text;
  messages.value.push({ role: 'user', content: text });
  scrollToEnd();

  loading.value = true;
  try {
    const res: RepairChatResult = await repairChat({
      message: text,
      category: category.value,
      description: text,
      history: messages.value.slice(0, -1),
    });
    messages.value.push({ role: 'assistant', content: res.reply });
    assessment.value = res.assessment;
    scrollToEnd();
  } catch {
    error.value = '상담 응답을 받지 못했습니다. 다시 시도해 주세요.';
  } finally {
    loading.value = false;
  }
}

// T-03 으로 — 상담 결과(분류·내용·수선비율)를 제보 화면에 prefill
function goReport() {
  router.push({
    name: 'tenant-defect-report',
    query: {
      category: category.value,
      description: lastDescription.value,
      rate: String(assessment.value?.repairRate ?? ''),
    },
  });
}
</script>

<template>
  <section class="page">
    <div class="chat-back"><BackHome /></div>
    <header class="bar">
      <p class="eyebrow">하자 상담</p>
      <h1 class="bar__title">하자를 상담하세요</h1>
    </header>

    <div class="disclaimer" role="note">
      <span class="disclaimer__dot" aria-hidden="true" />
      <span>본 상담은 <strong>{{ DISCLAIMER }}</strong>입니다.</span>
    </div>

    <div class="cat">
      <label class="cat__label">하자 분류</label>
      <select v-model="category" class="cat__select">
        <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
      </select>
    </div>

    <div ref="threadEl" class="thread">
      <p v-if="messages.length === 0" class="intro">
        <span class="intro__dot" aria-hidden="true" />하자 내용을 입력하면 임차 맥락을 반영해 상담합니다.
      </p>
      <div
        v-for="(m, i) in messages"
        :key="i"
        class="bubble"
        :class="m.role === 'user' ? 'bubble--mine' : 'bubble--ai'"
      >
        <p class="bubble__text">{{ m.content }}</p>
      </div>
      <p v-if="loading" class="typing">상담 내용을 분석하고 있습니다…</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- 수선비율 판정 결과 -->
    <div v-if="assessment" class="assess">
      <div class="assess__row">
        <span class="assess__k">예상 임대인 분담 비율</span>
        <strong class="assess__v num">{{ assessment.repairRate }}%</strong>
      </div>
      <p class="assess__rationale">{{ assessment.rationale }}</p>
      <span class="assess__flag" :class="assessment.needsLandlord ? 'flag--need' : 'flag--ok'">
        <span class="flag__dot" aria-hidden="true" />
        {{ assessment.needsLandlord ? '임대인 연락 권장' : '임차인 관리 범위 가능성' }}
      </span>
      <button class="report-btn" type="button" @click="goReport">이 내용으로 제보하기 →</button>
    </div>

    <form class="compose" @submit.prevent="send">
      <input v-model="draft" class="compose__input" placeholder="예) 보일러가 온수만 나오지 않습니다." />
      <button class="compose__send" type="submit" :disabled="!draft.trim() || loading">전송</button>
    </form>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--paper, #fbfaf6);
}
.chat-back {
  padding: var(--s-4, 12px) var(--s-6, 20px) 0;
}
.bar {
  padding: var(--s-5, 16px) var(--s-6, 20px) var(--s-4, 12px);
  border-bottom: 1px solid var(--slate-100, #eceef1);
}
.eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brass-ink, #50402a);
  margin: 0 0 4px;
}
.bar__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--ink, #1e2331);
  margin: 0;
}
.disclaimer {
  display: flex;
  align-items: center;
  gap: var(--s-3, 8px);
  margin: var(--s-4, 12px) var(--s-6, 20px) 0;
  padding: 12px 14px;
  background: var(--amber-soft, #f3e9cf);
  border: 1px solid var(--amber, #ce9a3b);
  border-radius: var(--r-card, 12px);
  font-size: 12px;
  color: var(--ink-2, #3a4151);
}
.disclaimer__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--amber, #ce9a3b);
  flex: none;
}
.cat {
  display: flex;
  align-items: center;
  gap: var(--s-3, 8px);
  padding: var(--s-4, 12px) var(--s-6, 20px) 0;
}
.cat__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2, #3a4151);
}
.cat__select {
  flex: 1;
  padding: 9px 12px;
  min-height: 40px;
  border: 1px solid var(--slate-300, #cacfd8);
  border-radius: var(--r-input, 8px);
  font-size: 14px;
  color: var(--ink, #1e2331);
  background: var(--paper, #fbfaf6);
}
.thread {
  flex: 1;
  overflow-y: auto;
  padding: var(--s-6, 20px);
  display: flex;
  flex-direction: column;
  gap: var(--s-3, 8px);
}
.intro {
  display: flex;
  align-items: center;
  gap: var(--s-3, 8px);
  color: var(--ink-3, #5e6675);
  font-size: 15px;
  margin: auto 0;
}
.intro__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--brass, #c79a4a);
  flex: none;
}
.bubble {
  max-width: 82%;
  padding: 10px 12px;
  border-radius: var(--r-card, 12px);
}
.bubble--mine {
  align-self: flex-end;
  background: var(--ink, #1e2331);
  color: var(--paper, #fbfaf6);
}
.bubble--ai {
  align-self: flex-start;
  background: var(--paper-raised, #ffffff);
  border: 1px solid var(--slate-100, #eceef1);
  color: var(--ink, #1e2331);
}
.bubble__text {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}
.typing {
  font-size: 13px;
  color: var(--ink-3, #5e6675);
}
.error {
  font-size: 13px;
  color: var(--crimson, #b5443c);
}
.assess {
  margin: 0 var(--s-6, 20px);
  padding: var(--s-5, 16px);
  background: var(--paper-raised, #ffffff);
  border: 1px solid var(--slate-100, #eceef1);
  border-radius: var(--r-card, 12px);
  display: flex;
  flex-direction: column;
  gap: var(--s-3, 8px);
}
.assess__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.assess__k {
  font-size: 13px;
  color: var(--ink-2, #3a4151);
}
.assess__v {
  font-size: 24px;
  font-weight: 700;
  color: var(--ink, #1e2331);
}
.num {
  font-variant-numeric: tabular-nums;
}
.assess__rationale {
  font-size: 13px;
  color: var(--ink-3, #5e6675);
  line-height: 1.55;
  margin: 0;
}
.assess__flag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: var(--r-pill, 999px);
  font-size: 12px;
  font-weight: 600;
}
.flag--need {
  background: var(--amber-soft, #f3e9cf);
  color: var(--brass-ink, #50402a);
}
.flag--ok {
  background: var(--sage-soft, #dfefe6);
  color: var(--sage, #4e8a6f);
}
.flag__dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
}
.report-btn {
  margin-top: 4px;
  padding: 11px 20px;
  min-height: 44px;
  border: 0;
  border-radius: var(--r-pill, 999px);
  background: var(--brass, #c79a4a);
  color: var(--ink, #1e2331);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.compose {
  display: flex;
  gap: var(--s-3, 8px);
  padding: var(--s-4, 12px) var(--s-6, 20px);
  border-top: 1px solid var(--slate-100, #eceef1);
  background: var(--paper-raised, #ffffff);
}
.compose__input {
  flex: 1;
  padding: 11px 12px;
  min-height: 44px;
  border: 1px solid var(--slate-300, #cacfd8);
  border-radius: var(--r-input, 8px);
  font-size: 15px;
  color: var(--ink, #1e2331);
}
.compose__input:focus {
  outline: none;
  border-color: var(--ink, #1e2331);
  border-width: 1.5px;
}
.compose__send {
  padding: 0 20px;
  min-height: 44px;
  border: 0;
  border-radius: var(--r-pill, 999px);
  background: var(--ink, #1e2331);
  color: var(--paper, #fbfaf6);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
}
.compose__send:disabled {
  opacity: 0.4;
  cursor: default;
}
</style>
