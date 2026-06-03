<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { APP_META } from '@/types/user';
import ButlerLogo from '@/components/layout/ButlerLogo.vue';

const auth = useAuthStore();
const ui = useUiStore();

const roleLabel = computed(() =>
  auth.userType ? APP_META[auth.userType].label : null,
);
</script>

<template>
  <header class="topbar">
    <!-- 좌상단: 기능 탭(드로어) 열기 버튼 -->
    <button
      v-if="auth.isAuthed"
      class="menu-btn"
      type="button"
      aria-label="기능 메뉴 열기"
      @click="ui.toggleDrawer()"
    >
      <span class="bars"><i /><i /><i /></span>
    </button>
    <!-- 로그인 역할에 따라 아이콘 교체(상단바는 paper 배경이라 tile 불필요) -->
    <ButlerLogo :size="30" wordmark />
    <span v-if="roleLabel" class="role-chip">{{ roleLabel }}</span>
    <span v-else class="tagline">집의 매니저</span>
  </header>
</template>

<style scoped>
.topbar {
  flex-shrink: 0;
  height: 56px;
  padding: env(safe-area-inset-top) 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--slate-100);
  background: var(--paper);
}

.menu-btn {
  flex-shrink: 0;
  appearance: none;
  border: none;
  background: transparent;
  padding: 6px;
  margin-left: -6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.menu-btn .bars {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
}
.menu-btn .bars i {
  display: block;
  width: 20px;
  height: 2px;
  border-radius: 2px;
  background: var(--ink);
}

.wordmark {
  font-family: var(--font-serif);
  font-size: 26px;
  line-height: 1;
  letter-spacing: -0.025em;
}

.wordmark .dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--brass);
  margin-left: 2px;
  vertical-align: 2px;
}

.tagline {
  font-size: 12px;
  color: var(--ink-3);
}

.role-chip {
  font-size: 11px;
  font-weight: 600;
  color: var(--brass-ink);
  background: var(--brass-soft);
  padding: 3px 9px;
  border-radius: var(--r-pill);
}
</style>
