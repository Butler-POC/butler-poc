<script setup lang="ts">
import { onMounted } from 'vue';
import PhoneFrame from '@/components/layout/PhoneFrame.vue';
import TopBar from '@/components/layout/TopBar.vue';
import { useAuthStore } from '@/stores/auth';

// 저장된 토큰이 있으면 유효성 확인 후 사용자 정보 갱신
onMounted(() => useAuthStore().refresh());
</script>

<template>
  <PhoneFrame>
    <TopBar />
    <main class="content">
      <RouterView />
    </main>
  </PhoneFrame>
</template>

<style scoped>
.content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20px 20px calc(24px + env(safe-area-inset-bottom));
}
</style>
