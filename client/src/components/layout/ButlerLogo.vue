<!-- 공용 Butler 로고 — 상단바 / 스플래시 공통. -->
<!-- 로그인 사용자의 역할에 따라 아이콘이 교체된다(role prop 미지정 시 auth 스토어 사용). -->
<!-- 다크 배경에서는 tile 로 paper 타일을 깔아 아이콘 가독성을 확보한다. -->
<!-- 색상은 ink/paper/brass 토큰만 사용(그라데이션·그림자·기타 색상 없음). -->
<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { UserType } from '@/types/user';
import { butlerIcon } from '@/lib/butlerIcon';

const props = withDefaults(
  defineProps<{
    role?: UserType | null; // 명시 시 우선. 미지정(undefined)이면 로그인 역할 사용.
    size?: number; // 아이콘 한 변(px)
    tile?: boolean; // 다크 배경용 paper 타일
    wordmark?: boolean; // "Butler" 워드마크 동반 표기
  }>(),
  { size: 32, tile: false, wordmark: false },
);

const auth = useAuthStore();
// role 을 명시적으로 넘기면(null 포함) 그 값을, 안 넘기면 로그인 역할을 사용
const effectiveRole = computed(() => (props.role !== undefined ? props.role : auth.userType));
const src = computed(() => butlerIcon(effectiveRole.value));
</script>

<template>
  <span class="blogo" :class="{ 'blogo--tile': tile }">
    <img
      class="blogo__img"
      :src="src"
      :style="{ width: size + 'px', height: size + 'px' }"
      alt="Butler"
      decoding="async"
    />
    <span v-if="wordmark" class="blogo__word">Butler<i class="blogo__dot" aria-hidden="true" /></span>
  </span>
</template>

<style scoped>
.blogo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.blogo__img {
  display: block;
  object-fit: contain;
}
/* 다크 배경용 paper 타일 (그림자·그라데이션 없음) */
.blogo--tile .blogo__img {
  background: var(--paper, #fbfaf6);
  border-radius: 22%;
  padding: 8%;
  box-sizing: border-box;
}
.blogo__word {
  font-family: var(--font-serif, Georgia, serif);
  font-size: 22px;
  line-height: 1;
  letter-spacing: -0.025em;
  color: var(--ink, #1e2331);
}
.blogo__dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--brass, #c79a4a);
  margin-left: 2px;
  vertical-align: 2px;
}
</style>
