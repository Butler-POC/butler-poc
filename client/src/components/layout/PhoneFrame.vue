<script setup lang="ts">
/**
 * PhoneFrame — 모바일 퍼스트 셸.
 * 모바일: 화면 전체를 채움.
 * 데스크톱(≥640px): 가운데 폰 크기 프레임 안에 모바일 화면을 렌더해 앱처럼 확인.
 */
</script>

<template>
  <div class="frame-bg">
    <div class="phone">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.frame-bg {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.phone {
  position: relative;
  width: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--paper);
  overflow: hidden;
}

/* 데스크톱: 폰 프레임으로 감싼다 */
@media (min-width: 640px) {
  .frame-bg {
    background: var(--paper-sunk);
    padding: 24px;
  }

  .phone {
    width: 390px;
    height: min(844px, calc(100dvh - 48px));
    border-radius: 44px;
    border: 1px solid var(--slate-200);
    box-shadow: var(--shadow-3);
  }
}
</style>
