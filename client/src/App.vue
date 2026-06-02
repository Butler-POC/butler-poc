<script setup lang="ts">
import { onMounted, ref } from 'vue';
import PhoneFrame from '@/components/layout/PhoneFrame.vue';
import TopBar from '@/components/layout/TopBar.vue';
import ButlerSplash from '@/components/layout/ButlerSplash.vue';
import { useAuthStore } from '@/stores/auth';

// 인앱 스플래시: 진입 시 노출 → 토큰 검증(역할 확정) + 최소 표시시간 후 페이드아웃
const showSplash = ref(true);

onMounted(async () => {
  const auth = useAuthStore();
  const minDelay = new Promise((r) => setTimeout(r, 900));
  await Promise.all([auth.refresh(), minDelay]);
  showSplash.value = false;
});
</script>

<template>
  <PhoneFrame>
    <TopBar />
    <main class="content">
      <RouterView />
    </main>
  </PhoneFrame>

  <Transition name="splash-fade">
    <ButlerSplash v-if="showSplash" />
  </Transition>
</template>

<style scoped>
.content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20px 20px calc(24px + env(safe-area-inset-bottom));
}
.splash-fade-leave-active {
  transition: opacity 0.4s ease;
}
.splash-fade-leave-to {
  opacity: 0;
}
</style>
