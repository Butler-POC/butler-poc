<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useBuildingsStore } from '@/stores/buildings';
import BuildingCard from '@/components/domain/BuildingCard.vue';

const store = useBuildingsStore();
const { items, loading } = storeToRefs(store);

onMounted(() => {
  if (!store.loaded) store.fetch();
});

function onRemove(id: string) {
  store.remove(id);
}
</script>

<template>
  <div class="view">
    <RouterLink class="back" to="/app/landlord">← 홈으로</RouterLink>

    <header class="head">
      <p class="eyebrow">임대인 · L-01</p>
      <h1 class="title">내 건물</h1>
    </header>

    <RouterLink class="add" to="/app/landlord/buildings/new">＋ 새 건물 등록</RouterLink>

    <p v-if="loading" class="empty">불러오는 중…</p>
    <p v-else-if="items.length === 0" class="empty">등록된 건물이 없습니다.</p>

    <div v-else class="list">
      <BuildingCard
        v-for="b in items"
        :key="b.id"
        :building="b"
        @remove="onRemove"
      />
    </div>
  </div>
</template>

<style scoped>
.view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.back {
  align-self: flex-start;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-2);
  text-decoration: none;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brass-ink);
}
.title {
  font-size: 28px;
  font-weight: 700;
}
.add {
  display: block;
  text-align: center;
  text-decoration: none;
  background: var(--ink);
  color: var(--paper);
  font-size: 14px;
  font-weight: 600;
  padding: 13px;
  border-radius: var(--r-pill);
}
.empty {
  margin: 24px 0;
  text-align: center;
  font-size: 14px;
  color: var(--ink-3);
}
.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
