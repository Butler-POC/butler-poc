<script setup lang="ts">
import { computed } from 'vue';
import OcrScanner from '@/components/domain/OcrScanner.vue';
import { useAuthStore } from '@/stores/auth';
import { APP_META } from '@/types/user';

const auth = useAuthStore();
const home = computed(() => (auth.userType ? APP_META[auth.userType].home : '/'));
</script>

<template>
  <div class="scan-view">
    <RouterLink class="back" :to="home">← 홈으로</RouterLink>
    <header class="head">
      <p class="eyebrow">공통 · C-01</p>
      <h1 class="title">문서 텍스트 추출</h1>
      <p class="desc">
        등기부등본·계약서·건축물대장을 올리면 텍스트를 추출합니다. 텍스트가 있는 PDF는 그대로
        읽고, 이미지나 스캔본은 LLM 비전으로 인식합니다.
      </p>
    </header>
    <OcrScanner />
  </div>
</template>

<style scoped>
.scan-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.back {
  align-self: flex-start;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  text-decoration: none;
}

.back:hover {
  color: var(--brass-deep);
}

.head {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  font-size: 30px;
  font-weight: 700;
}

.desc {
  margin: 0;
  font-size: 15px;
  color: var(--ink-2);
  max-width: 52ch;
}
</style>
