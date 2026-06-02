<!-- T-03 하자 제보 (테넌트 → 오너) -->
<!-- 하자 내용 + 제안 수선비율을 임대인에게 제보. T-02 상담 결과를 query 로 prefill 받는다. -->
<!-- 가정(기반): useBuildingsStore(임차인의 임차 건물 목록) -->
<script setup lang="ts">
import { onMounted, reactive, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useIssuesStore } from '@/stores/issues';
import { useBuildingsStore } from '@/stores/buildings';
import type { IssueCategory, IssueReportInput } from '@/types';
import BaseButton from '@/components/ui/BaseButton.vue';
import BaseCard from '@/components/ui/BaseCard.vue';

const CATEGORIES: { value: IssueCategory; label: string }[] = [
  { value: 'plumbing', label: '수도/하수' },
  { value: 'electrical', label: '전기' },
  { value: 'boiler', label: '보일러/난방' },
  { value: 'waterproof', label: '누수/방수' },
  { value: 'interior', label: '내부 마감' },
  { value: 'appliance', label: '빌트인 가전' },
  { value: 'other', label: '기타' },
];

const route = useRoute();
const router = useRouter();
const issues = useIssuesStore();
const buildings = useBuildingsStore();

const form = reactive<IssueReportInput>({
  buildingId: '',
  tenantId: '', // 서버에서 req.user 로 보정됨
  category: (route.query.category as IssueCategory) || 'plumbing',
  description: (route.query.description as string) || '',
  proposedRepairRate: Number(route.query.rate) || 0,
});

const canSubmit = computed(
  () => form.buildingId && form.description.trim() && form.proposedRepairRate >= 0 && form.proposedRepairRate <= 100,
);

async function submit() {
  if (!canSubmit.value) return;
  const created = await issues.report({ ...form });
  if (created) router.push({ name: 'tenant-defect-history' });
}

onMounted(() => {
  buildings.load?.();
  // 임차 건물이 하나면 자동 선택
  const first = buildings.items?.[0];
  if (first && !form.buildingId) form.buildingId = first.id;
});
</script>

<template>
  <section class="page">
    <header class="head">
      <p class="eyebrow">하자 제보</p>
      <h1 class="title">하자를 제보하세요</h1>
    </header>

    <BaseCard>
      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span class="label">건물</span>
          <select v-model="form.buildingId" class="control">
            <option value="" disabled>임차 건물을 선택하세요</option>
            <option v-for="b in buildings.items ?? []" :key="b.id" :value="b.id">{{ b.address }}</option>
          </select>
        </label>

        <label class="field">
          <span class="label">하자 분류</span>
          <select v-model="form.category" class="control">
            <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
          </select>
        </label>

        <label class="field">
          <span class="label">하자 내용</span>
          <textarea v-model="form.description" class="control" rows="4" placeholder="언제부터, 어떤 증상인지 적어 주세요." />
        </label>

        <label class="field">
          <span class="label">제안 수선비율 (임대인 분담, %)</span>
          <div class="rate">
            <input v-model.number="form.proposedRepairRate" type="range" min="0" max="100" step="5" class="rate__slider" />
            <output class="rate__val num">{{ form.proposedRepairRate }}%</output>
          </div>
        </label>

        <p v-if="issues.error" class="error">{{ issues.error }}</p>

        <BaseButton variant="brass" size="lg" type="submit" :disabled="!canSubmit || issues.loading">
          임대인에게 제보
        </BaseButton>
        <p class="note">제안 비율에 따라 임대인 연락이 필요하면 임대인에게 즉시 전달됩니다.</p>
      </form>
    </BaseCard>
  </section>
</template>

<style scoped>
.page {
  padding: var(--s-6, 20px);
  display: flex;
  flex-direction: column;
  gap: var(--s-6, 20px);
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
.form {
  display: flex;
  flex-direction: column;
  gap: var(--s-5, 16px);
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
.control:focus {
  outline: none;
  border-color: var(--ink, #1e2331);
  border-width: 1.5px;
}
.rate {
  display: flex;
  align-items: center;
  gap: var(--s-4, 12px);
}
.rate__slider {
  flex: 1;
  accent-color: var(--brass, #c79a4a);
  min-height: 44px;
}
.rate__val {
  min-width: 52px;
  text-align: right;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink, #1e2331);
}
.num {
  font-variant-numeric: tabular-nums;
}
.error {
  font-size: 11px;
  color: var(--crimson, #b5443c);
  margin: 0;
}
.note {
  font-size: 12px;
  color: var(--ink-3, #5e6675);
  margin: 0;
}
</style>
