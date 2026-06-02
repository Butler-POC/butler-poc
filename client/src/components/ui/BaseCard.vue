<!-- 기반 UI — 카드. 머지 통합 시 최소 구현(토큰 기반). 콘텐츠 슬롯 래퍼. -->
<template>
  <div class="card">
    <slot />
  </div>
</template>

<style scoped>
.card {
  background: var(--paper-raised, #ffffff);
  border: 1px solid var(--slate-100, #eceef1);
  border-radius: var(--r-card, 12px);
  padding: var(--s-5, 16px);
}
</style>
