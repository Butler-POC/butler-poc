<!-- L-06 간단 법률 상담 (버틀러 오너) -->
<!-- 별도 프롬프트 입력 없이, 서버가 본인 건물·임차인 맥락을 자동 주입한다(POST /api/chat, mode:'legal'). -->
<!-- ⚠️ AI 출력은 참고용 · 법적 효력 없음 — 디스클레이머 상시 노출(설계 규칙). -->
<!-- 가정(기반): @/api/client (axios, baseURL '/api') -->
<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { api as http } from '@/api/client';

type Msg = { role: 'user' | 'assistant'; content: string };

const messages = ref<Msg[]>([]);
const draft = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const threadEl = ref<HTMLElement | null>(null);
const DISCLAIMER = '참고용 · 법적 효력 없음';

async function scrollToEnd() {
  await nextTick();
  if (threadEl.value) threadEl.value.scrollTop = threadEl.value.scrollHeight;
}

async function send() {
  const text = draft.value.trim();
  if (!text || loading.value) return;
  draft.value = '';
  error.value = null;
  messages.value.push({ role: 'user', content: text });
  scrollToEnd();

  loading.value = true;
  try {
    const history = messages.value.slice(0, -1);
    const { data } = await http.post<{ reply: string; disclaimer: string }>('/chat', {
      mode: 'legal',
      message: text,
      history,
    });
    messages.value.push({ role: 'assistant', content: data.reply });
    scrollToEnd();
  } catch (e) {
    error.value = '답변을 받지 못했습니다. 다시 시도해 주세요.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <section class="page">
    <header class="bar">
      <div>
        <p class="eyebrow">간단 법률 상담</p>
        <h1 class="bar__title">임대차 상담</h1>
      </div>
    </header>

    <!-- 디스클레이머 (상시 노출) -->
    <div class="disclaimer" role="note">
      <span class="disclaimer__dot" aria-hidden="true" />
      <span>본 답변은 <strong>{{ DISCLAIMER }}</strong>입니다. 중요한 사안은 변호사와 상담하세요.</span>
    </div>

    <div ref="threadEl" class="thread">
      <p v-if="messages.length === 0" class="intro">
        <span class="intro__dot" aria-hidden="true" />
        등록하신 건물·임차인 정보를 바탕으로 답합니다. 궁금한 점을 입력하세요.
      </p>

      <div
        v-for="(m, i) in messages"
        :key="i"
        class="bubble"
        :class="m.role === 'user' ? 'bubble--mine' : 'bubble--ai'"
      >
        <p class="bubble__text">{{ m.content }}</p>
      </div>

      <p v-if="loading" class="typing">답변을 작성하고 있습니다…</p>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <form class="compose" @submit.prevent="send">
      <input v-model="draft" class="compose__input" placeholder="예) 월세 2개월 연체 시 계약 해지가 가능한가요?" />
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
.bar {
  padding: var(--s-5, 16px) var(--s-6, 20px);
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
/* amber inline 배너 (Design.md BANNER) */
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
  line-height: 1.55;
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
