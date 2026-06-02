<!-- 공용 '← 홈으로' 링크 — 로그인 역할의 홈으로 이동. jg 페이지의 .back 패턴과 통일. -->
<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { APP_META } from '@/types/user';

const auth = useAuthStore();
const home = computed(() => (auth.userType ? APP_META[auth.userType].home : '/login'));
</script>

<template>
  <RouterLink class="back" :to="home">← 홈으로</RouterLink>
</template>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  font-size: 13px;
  color: var(--ink-3, #5e6675);
  text-decoration: none;
  padding: 4px 0;
}
.back:hover {
  color: var(--ink, #1e2331);
}
</style>
