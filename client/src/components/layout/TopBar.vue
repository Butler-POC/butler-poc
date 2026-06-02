<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { APP_META } from '@/types/user';
import ButlerLogo from '@/components/layout/ButlerLogo.vue';

const auth = useAuthStore();
const router = useRouter();

const roleLabel = computed(() =>
  auth.userType ? APP_META[auth.userType].label : null,
);

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <header class="topbar">
    <!-- 로그인 역할에 따라 아이콘 교체(상단바는 paper 배경이라 tile 불필요) -->
    <ButlerLogo :size="30" wordmark />
    <span v-if="roleLabel" class="role-chip">{{ roleLabel }}</span>
    <span v-else class="tagline">집의 매니저</span>
    <button v-if="auth.isAuthed" class="logout" type="button" @click="logout">
      로그아웃
    </button>
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

.logout {
  margin-left: auto;
  appearance: none;
  border: 1px solid var(--slate-200);
  background: var(--paper);
  color: var(--ink-2);
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  padding: 6px 12px;
  border-radius: var(--r-pill);
  cursor: pointer;
}

.logout:hover {
  background: var(--paper-sunk);
}
</style>
