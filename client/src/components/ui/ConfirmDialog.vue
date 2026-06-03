<script setup lang="ts">
// 삭제 확인 팝업 — 건물 상세 페이지의 삭제 형식을 공용화한 컴포넌트.
// 부모가 open 으로 표시 제어, confirm/cancel 이벤트를 받는다. 경고 본문은 기본 슬롯.
withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    confirmText?: string;
    cancelText?: string;
    busy?: boolean;
    busyText?: string;
  }>(),
  { confirmText: '삭제', cancelText: '취소', busy: false, busyText: '삭제 중…' },
);

defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void }>();
</script>

<template>
  <div v-if="open" class="modal-root" @click.self="$emit('cancel')">
    <div class="modal" role="alertdialog" aria-modal="true">
      <h3 class="m-title">{{ title }}</h3>
      <p class="m-warn"><slot /></p>
      <div class="m-actions">
        <button class="btn ghost" type="button" :disabled="busy" @click="$emit('cancel')">
          {{ cancelText }}
        </button>
        <button class="btn danger" type="button" :disabled="busy" @click="$emit('confirm')">
          {{ busy ? busyText : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-root {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px;
  background: rgba(20, 18, 14, 0.45);
}
.modal {
  width: 100%;
  max-width: 340px;
  background: var(--paper-raised);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-3);
  padding: 22px 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.m-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}
.m-warn {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-2);
}
.m-warn :deep(strong) {
  color: var(--crimson);
}
.m-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.btn {
  flex: 1;
  appearance: none;
  border: none;
  border-radius: var(--r-pill);
  padding: 12px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}
.btn.ghost {
  background: var(--paper);
  color: var(--ink-2);
  border: 1px solid var(--slate-200);
}
.btn.danger {
  background: var(--crimson-soft);
  color: var(--crimson);
  border: 1px solid var(--crimson);
}
.btn:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
