<!-- 인앱 스플래시 — 진입 시 잠깐 노출. 로그인 역할에 맞는 집사 아이콘을 보여준다. -->
<!-- 다크(ink) 배경 + paper 타일 로고. 색상은 ink/paper/brass 토큰만. -->
<script setup lang="ts">
import ButlerLogo from './ButlerLogo.vue';
</script>

<template>
  <div class="splash" role="status" aria-label="Butler 로딩 중">
    <ButlerLogo :size="112" tile />
    <p class="splash__word">Butler</p>
    <p class="splash__tag">집의 매니저</p>
  </div>
</template>

<style scoped>
.splash {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--ink, #1e2331);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
}
.splash__word {
  margin: 4px 0 0;
  font-family: var(--font-serif, Georgia, serif);
  font-size: 28px;
  letter-spacing: -0.02em;
  color: var(--paper, #fbfaf6);
}
.splash__tag {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.02em;
  color: var(--brass, #c79a4a);
}
</style>
