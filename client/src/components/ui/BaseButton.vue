<!-- 기반 UI — 버튼. 머지 통합 시 최소 구현(토큰 기반). variant/size 지원, 그 외 속성(type·disabled·@click)은 fall-through. -->
<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'brass' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
  }>(),
  { variant: 'primary', size: 'md' },
);
</script>

<template>
  <button class="btn" :class="[`btn--${variant}`, `btn--${size}`]">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-radius: var(--r-pill, 999px);
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.btn:disabled {
  opacity: 0.4;
  cursor: default;
}
/* variant */
.btn--primary {
  background: var(--ink, #1e2331);
  color: var(--paper, #fbfaf6);
}
.btn--brass {
  background: var(--brass, #c79a4a);
  color: var(--ink, #1e2331);
}
.btn--secondary {
  background: var(--paper-raised, #fff);
  color: var(--ink, #1e2331);
  border: 1px solid var(--slate-300, #cacfd8);
}
/* size */
.btn--sm {
  min-height: 36px;
  padding: 0 14px;
  font-size: 13px;
}
.btn--md {
  min-height: 44px;
  padding: 0 18px;
  font-size: 14px;
}
.btn--lg {
  min-height: 48px;
  padding: 0 22px;
  font-size: 15px;
  width: 100%;
}
</style>
