<!-- L-05 수선 업체 지도 — 건물 위치 + 주변 업체 마커 -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useKakaoMap } from '@/composables/useKakaoMap';
import type { Vendor } from '@/types';

const props = defineProps<{ vendors: Vendor[]; center: { lat: number; lng: number } }>();

const el = ref<HTMLElement | null>(null);
const error = ref<string | null>(null);
const { ready, init, setCenter, renderVendors } = useKakaoMap();

onMounted(async () => {
  if (!el.value) return;
  try {
    await init(el.value, props.center);
    renderVendors(props.vendors);
  } catch (e) {
    error.value = '지도를 불러오지 못했습니다.';
  }
});

watch(() => props.center, (c) => ready.value && setCenter(c));
watch(
  () => props.vendors,
  (v) => ready.value && renderVendors(v),
);
</script>

<template>
  <div class="map-wrap">
    <div ref="el" class="map" />
    <p v-if="error" class="map-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.map-wrap {
  position: relative;
  width: 100%;
  height: 240px;
}
.map {
  width: 100%;
  height: 100%;
  border-radius: var(--r-card, 12px);
  border: 1px solid var(--slate-100, #eceef1);
  overflow: hidden;
}
.map-error {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: 13px;
  color: var(--ink-3, #5e6675);
  background: var(--paper-sunk, #f4f2ed);
  border-radius: var(--r-card, 12px);
}
</style>
