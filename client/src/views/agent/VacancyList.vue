<!-- A-01 공실 조회 (에이전트) -->
<!-- 임대인이 등록한 공실을 "빈 방 + 임대인 정보" 카드로 조회·필터. 카드에서 A-02 채팅으로 진입. -->
<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useVacanciesStore } from '@/stores/vacancies';
import BaseCard from '@/components/ui/BaseCard.vue';
import BaseButton from '@/components/ui/BaseButton.vue';

const vacancies = useVacanciesStore();
const router = useRouter();
const onlyAvailable = ref(true);

const won = (n: number | null) => (n == null ? '미정' : '₩' + n.toLocaleString('ko-KR'));

const items = computed(() =>
  onlyAvailable.value ? vacancies.listing.filter((v) => v.status === 'OPEN') : vacancies.listing,
);

function openChat(vacancyId: string) {
  // A-02: 공실 상세 → 임대인 연결(채팅)
  router.push({ name: 'agent-owner-chat', params: { vacancyId } });
}

onMounted(() => vacancies.loadListing());
</script>

<template>
  <section class="page">
    <header class="page__head">
      <p class="eyebrow">매물 조회</p>
      <h1 class="title">공실을 둘러보세요</h1>
    </header>

    <div class="filter">
      <label class="toggle">
        <input v-model="onlyAvailable" type="checkbox" />
        <span>모집중만 보기</span>
      </label>
    </div>

    <p v-if="vacancies.error" class="error">{{ vacancies.error }}</p>

    <p v-else-if="!vacancies.loading && items.length === 0" class="empty">
      <span class="empty__dot" aria-hidden="true" />조회된 공실이 없습니다.
    </p>

    <ul v-else class="grid">
      <li v-for="v in items" :key="v.id">
        <BaseCard>
          <article class="prop">
            <div class="prop__head">
              <span class="chip" :class="v.status === 'OPEN' ? 'chip--ok' : 'chip--muted'">
                {{ v.status === 'OPEN' ? '모집중' : '마감' }}
              </span>
              <strong class="prop__unit">{{ v.unit ?? '호실 미정' }}</strong>
            </div>
            <p class="prop__addr">{{ v.buildingAddress ?? '주소 정보 없음' }}</p>
            <p v-if="v.areaM2 != null" class="prop__meta">전용 {{ v.areaM2 }}㎡</p>
            <p class="prop__money num">보증금 {{ won(v.deposit) }} · 월세 {{ won(v.monthlyRent) }}</p>
            <p v-if="v.description" class="prop__desc">{{ v.description }}</p>
            <div class="prop__owner">
              <span class="prop__ownername">{{ v.owner.name }}</span>
              <BaseButton variant="secondary" size="sm" @click="openChat(v.id)">임대인 연결</BaseButton>
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
  margin: 0 0 var(--s-2, 4px);
}
.title {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.012em;
  color: var(--ink, #1e2331);
  margin: 0;
}
.filter {
  display: flex;
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3, 8px);
  font-size: 13px;
  color: var(--ink-2, #3a4151);
  min-height: 44px;
}
.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--s-4, 12px);
}
.prop__head {
  display: flex;
  align-items: center;
  gap: var(--s-3, 8px);
}
.prop__unit {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink, #1e2331);
}
.prop__addr {
  font-size: 13px;
  color: var(--ink-2, #3a4151);
  margin: 8px 0 0;
}
.prop__meta {
  font-size: 12px;
  color: var(--ink-3, #5e6675);
  margin: 4px 0 0;
}
.prop__money {
  font-size: 15px;
  color: var(--ink-2, #3a4151);
  margin: 6px 0 0;
}
.num {
  font-variant-numeric: tabular-nums;
}
.prop__desc {
  font-size: 13px;
  color: var(--ink-3, #5e6675);
  line-height: 1.55;
  margin: 8px 0 0;
}
.prop__owner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3, 8px);
  margin-top: var(--s-5, 16px);
  padding-top: var(--s-4, 12px);
  border-top: 1px solid var(--slate-100, #eceef1);
}
.prop__ownername {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink, #1e2331);
}
.chip {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--r-pill, 999px);
}
.chip--ok {
  background: var(--sage-soft, #dfefe6);
  color: var(--sage, #4e8a6f);
}
.chip--muted {
  background: var(--paper-sunk, #f4f2ed);
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
