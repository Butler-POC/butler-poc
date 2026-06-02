<!-- L-05 수선 업체 조회 (버틀러 오너) -->
<!-- 건물 위치 기준으로 보일러/에어컨/입주청소/하수도 업체를 리스트 + 지도로 조회. -->
<!-- 가정(기반): useBuildingsStore(임대인 건물 { id, address, lat?, lng? }). 좌표 없으면 기본 위치(서울시청). -->
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useBuildingsStore } from '@/stores/buildings';
import { fetchVendors } from '@/api/vendors';
import type { Vendor, VendorCategory } from '@/types';
import VendorMap from '@/components/domain/VendorMap.vue';
import BaseCard from '@/components/ui/BaseCard.vue';
import BackHome from '@/components/layout/BackHome.vue';

const CATEGORIES: { value: VendorCategory; label: string }[] = [
  { value: 'boiler', label: '보일러' },
  { value: 'aircon', label: '에어컨' },
  { value: 'cleaning', label: '입주청소' },
  { value: 'plumbing', label: '하수도' },
];
const DEFAULT_CENTER = { lat: 37.5663, lng: 126.9779 }; // 서울시청 (좌표 미상 시 폴백)

const buildings = useBuildingsStore();
const buildingId = ref('');
const category = ref<VendorCategory>('boiler');
const vendors = ref<Vendor[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searched = ref(false);

const center = computed(() => {
  const b: any = (buildings.items ?? []).find((x: any) => x.id === buildingId.value);
  if (b && typeof b.lat === 'number' && typeof b.lng === 'number') return { lat: b.lat, lng: b.lng };
  return DEFAULT_CENTER;
});

async function search() {
  loading.value = true;
  error.value = null;
  searched.value = true;
  try {
    vendors.value = await fetchVendors({
      category: category.value,
      lat: center.value.lat,
      lng: center.value.lng,
    });
  } catch {
    error.value = '업체를 불러오지 못했습니다. 다시 시도해 주세요.';
    vendors.value = [];
  } finally {
    loading.value = false;
  }
}

function pick(c: VendorCategory) {
  category.value = c;
  search();
}

const fmtDist = (m?: number) => (typeof m === 'number' ? (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${m}m`) : '');

onMounted(async () => {
  await buildings.fetch();
  const first = buildings.items?.[0];
  if (first) buildingId.value = first.id;
});
</script>

<template>
  <section class="page">
    <BackHome />
    <header class="head">
      <p class="eyebrow">수선 업체</p>
      <h1 class="title">주변 업체를 찾으세요</h1>
    </header>

    <label class="field">
      <span class="label">건물</span>
      <select v-model="buildingId" class="control" @change="searched && search()">
        <option value="" disabled>건물을 선택하세요</option>
        <option v-for="b in buildings.items ?? []" :key="b.id" :value="b.id">{{ b.address }}</option>
      </select>
    </label>

    <!-- 카테고리 칩 -->
    <div class="cats" role="tablist">
      <button
        v-for="c in CATEGORIES"
        :key="c.value"
        class="cat"
        :class="{ 'cat--on': category === c.value }"
        type="button"
        @click="pick(c.value)"
      >
        {{ c.label }}
      </button>
    </div>

    <!-- 지도 -->
    <VendorMap :vendors="vendors" :center="center" />

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="loading" class="hint">업체를 찾고 있습니다…</p>
    <p v-else-if="searched && vendors.length === 0" class="empty">
      <span class="empty__dot" aria-hidden="true" />주변에서 업체를 찾지 못했습니다.
    </p>
    <p v-else-if="!searched" class="hint">카테고리를 선택하면 건물 주변 업체를 조회합니다.</p>

    <!-- 리스트 -->
    <ul v-if="vendors.length" class="list">
      <li v-for="v in vendors" :key="v.id">
        <BaseCard>
          <article class="vendor">
            <div class="vendor__head">
              <strong class="vendor__name">{{ v.name }}</strong>
              <span v-if="v.distance" class="vendor__dist num">{{ fmtDist(v.distance) }}</span>
            </div>
            <p class="vendor__addr">{{ v.roadAddress || v.address }}</p>
            <div class="vendor__foot">
              <a v-if="v.phone" :href="`tel:${v.phone}`" class="vendor__phone num">{{ v.phone }}</a>
              <a v-if="v.placeUrl" :href="v.placeUrl" target="_blank" rel="noopener" class="vendor__link">상세 →</a>
            </div>
          </article>
        </BaseCard>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.page {
  padding: var(--s-6, 20px);
  display: flex;
  flex-direction: column;
  gap: var(--s-5, 16px);
  background: var(--paper, #fbfaf6);
  min-height: 100%;
}
.eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brass-ink, #50402a);
  margin: 0 0 4px;
}
.title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.012em;
  color: var(--ink, #1e2331);
  margin: 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-2, #3a4151);
}
.control {
  padding: 11px 12px;
  border: 1px solid var(--slate-300, #cacfd8);
  border-radius: var(--r-input, 8px);
  font-size: 15px;
  color: var(--ink, #1e2331);
  background: var(--paper, #fbfaf6);
  min-height: 44px;
}
.cats {
  display: flex;
  gap: var(--s-3, 8px);
  flex-wrap: wrap;
}
.cat {
  padding: 8px 16px;
  min-height: 40px;
  border: 1px solid var(--slate-200, #dee1e7);
  border-radius: var(--r-pill, 999px);
  background: var(--paper, #fbfaf6);
  color: var(--ink-2, #3a4151);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.cat--on {
  background: var(--ink, #1e2331);
  color: var(--paper, #fbfaf6);
  border-color: var(--ink, #1e2331);
}
.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-4, 12px);
}
.vendor__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-3, 8px);
}
.vendor__name {
  font-size: 15px;
  font-weight: 700;
  color: var(--ink, #1e2331);
}
.vendor__dist {
  font-size: 12px;
  color: var(--ink-3, #5e6675);
}
.num {
  font-variant-numeric: tabular-nums;
}
.vendor__addr {
  font-size: 13px;
  color: var(--ink-3, #5e6675);
  margin: 6px 0 0;
}
.vendor__foot {
  display: flex;
  align-items: center;
  gap: var(--s-5, 16px);
  margin-top: var(--s-4, 12px);
  padding-top: var(--s-3, 8px);
  border-top: 1px solid var(--slate-100, #eceef1);
}
.vendor__phone {
  font-size: 14px;
  color: var(--ink, #1e2331);
  text-decoration: none;
  font-weight: 600;
}
.vendor__link {
  font-size: 13px;
  color: var(--brass-ink, #50402a);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.hint {
  font-size: 14px;
  color: var(--ink-3, #5e6675);
}
.empty {
  display: flex;
  align-items: center;
  gap: var(--s-3, 8px);
  font-size: 15px;
  color: var(--ink-3, #5e6675);
}
.empty__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--brass, #c79a4a);
}
.error {
  font-size: 13px;
  color: var(--crimson, #b5443c);
}
</style>
