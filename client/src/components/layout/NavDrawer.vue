<script setup lang="ts">
// 좌측에서 열리는 기능 탭(드로어). 햄버거 버튼으로 토글, 배경/이동 시 닫힘.
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { APP_META } from '@/types/user';
import { ROLE_FEATURES, type Feature } from '@/lib/roleFeatures';

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();
const route = useRoute();

const meta = computed(() => (auth.userType ? APP_META[auth.userType] : null));
const features = computed(() => (auth.userType ? ROLE_FEATURES[auth.userType] : []));

// 라우트가 바뀌면 자동으로 닫는다
watch(
  () => route.fullPath,
  () => ui.closeDrawer(),
);

function go(f: Feature) {
  if (f.to) router.push(f.to);
  ui.closeDrawer();
}

function goHome() {
  if (meta.value) router.push(meta.value.home);
  ui.closeDrawer();
}

function logout() {
  auth.logout();
  ui.closeDrawer();
  router.push('/login');
}
</script>

<template>
  <div v-if="meta" class="drawer-root" :class="{ open: ui.drawerOpen }">
    <div class="backdrop" @click="ui.closeDrawer()" />

    <aside class="panel" role="dialog" aria-label="기능 메뉴">
      <header class="d-head">
        <div class="d-app">
          <p class="d-eyebrow">{{ meta.app }}</p>
          <p class="d-name">{{ auth.user?.name }} 님</p>
        </div>
        <button class="d-close" type="button" aria-label="닫기" @click="ui.closeDrawer()">✕</button>
      </header>

      <nav class="d-body">
        <button class="nav-home" type="button" @click="goHome">⌂ 메인화면</button>

        <ul class="nav-list">
          <li v-for="f in features" :key="f.code + f.name">
            <button class="nav-row" :class="{ disabled: !f.to }" type="button" @click="go(f)">
              <span class="nav-text">{{ f.name }}</span>
              <span v-if="f.to" class="nav-chev">→</span>
              <span v-else class="nav-soon">준비 중</span>
            </button>
          </li>
        </ul>
      </nav>

      <footer class="d-foot">
        <button class="d-logout" type="button" @click="logout">로그아웃</button>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.drawer-root {
  position: absolute;
  inset: 0;
  z-index: 50;
  pointer-events: none;
}
.backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 18, 14, 0.38);
  opacity: 0;
  transition: opacity 0.24s ease;
}
.panel {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: min(80%, 300px);
  display: flex;
  flex-direction: column;
  background: var(--paper);
  border-right: 1px solid var(--slate-200);
  box-shadow: var(--shadow-3);
  transform: translateX(-100%);
  transition: transform 0.26s cubic-bezier(0.4, 0, 0.2, 1);
  padding-top: env(safe-area-inset-top);
}
.drawer-root.open {
  pointer-events: auto;
}
.drawer-root.open .backdrop {
  opacity: 1;
}
.drawer-root.open .panel {
  transform: translateX(0);
}

.d-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--slate-100);
}
.d-app {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.d-eyebrow {
  margin: 0;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--brass-ink);
}
.d-name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}
.d-close {
  margin-left: auto;
  appearance: none;
  border: none;
  background: transparent;
  color: var(--ink-3);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 6px;
}

.d-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 12px 16px;
}
.nav-home {
  width: 100%;
  appearance: none;
  border: 1px solid var(--slate-200);
  background: var(--paper-sunk);
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  text-align: left;
  padding: 11px 14px;
  border-radius: var(--r-input);
  cursor: pointer;
  margin-bottom: 14px;
}
.d-group {
  margin: 14px 4px 7px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--ink-3);
}
.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--paper-raised);
  border: 1px solid var(--slate-100);
  border-radius: var(--r-card);
  overflow: hidden;
}
.nav-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  appearance: none;
  border: none;
  border-bottom: 1px solid var(--slate-100);
  background: transparent;
  font-family: inherit;
  text-align: left;
  padding: 12px 14px;
  cursor: pointer;
}
.nav-list li:last-child .nav-row {
  border-bottom: none;
}
.nav-row:hover {
  background: var(--paper-sunk);
}
.nav-row.disabled {
  cursor: default;
  opacity: 0.7;
}
.nav-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}
.nav-chev {
  margin-left: auto;
  color: var(--brass);
  font-size: 15px;
}
.nav-soon {
  margin-left: auto;
  font-size: 10px;
  color: var(--ink-4);
  background: var(--paper-sunk);
  border: 1px solid var(--slate-200);
  padding: 2px 7px;
  border-radius: var(--r-pill);
}

.d-foot {
  flex-shrink: 0;
  padding: 12px 16px calc(14px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--slate-100);
}
.d-logout {
  width: 100%;
  appearance: none;
  border: 1px solid var(--slate-200);
  background: var(--paper);
  color: var(--ink-2);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  padding: 11px;
  border-radius: var(--r-pill);
  cursor: pointer;
}
.d-logout:hover {
  background: var(--paper-sunk);
}
</style>
