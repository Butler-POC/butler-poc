<script setup lang="ts">
// 중개업자 메인화면 — 공실 조회(A-01). 임대인이 등록한 공실을 "빈 방 + 임대인 정보" 카드로 조회.
// 카드의 "임대인 연결"로 A-02 채팅 진입.
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
  router.push({ name: 'agent-owner-chat', params: { vacancyId } });
}

onMounted(() => vacancies.loadListing());
</script>

<template>
  <div class="home">
    <header class="head">
      <p class="eyebrow">중개업자</p>
      <h1 class="title">공실 조회</h1>
      <p class="desc">임대인이 등록한 공실 매물을 둘러보고 임대인과 연결하세요.</p>
    </header>

    <div class="filter">
      <label class="toggle">
        <input v-model="onlyAvailable" type="checkbox" />
        <span>모집중만 보기</span>
      </label>
    </div>

    <p v-if="vacancies.error" class="error">{{ vacancies.error }}</p>
    <p v-else-if="vacancies.loading" class="state">불러오는 중…</p>
    <p v-else-if="items.length === 0" class="state empty">조회된 공실이 없습니다.</p>

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
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.head {
  display: flex;
  flex-direction: column;
  gap: 5px;
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
.desc {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3);
}
.filter {
  display: flex;
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--ink-2);
  min-height: 40px;
  cursor: pointer;
}
.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.prop__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.prop__unit {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
}
.prop__addr {
  font-size: 13px;
  color: var(--ink-2);
  margin: 8px 0 0;
}
.prop__meta {
  font-size: 12px;
  color: var(--ink-3);
  margin: 4px 0 0;
}
.prop__money {
  font-size: 15px;
  color: var(--ink-2);
  margin: 6px 0 0;
}
.num {
  font-variant-numeric: tabular-nums;
}
.prop__desc {
  font-size: 13px;
  color: var(--ink-3);
  line-height: 1.55;
  margin: 8px 0 0;
}
.prop__owner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--slate-100);
}
.prop__ownername {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}
.chip {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--r-pill);
}
.chip--ok {
  background: var(--sage-soft);
  color: var(--sage);
}
.chip--muted {
  background: var(--paper-sunk);
  color: var(--ink-3);
}
.state {
  margin: 8px 0;
  text-align: center;
  font-size: 14px;
  color: var(--ink-3);
}
.state.empty {
  padding: 28px 16px;
  background: var(--paper-sunk);
  border: 1px solid var(--slate-100);
  border-radius: var(--r-card);
}
.error {
  font-size: 13px;
  color: var(--crimson);
  background: var(--crimson-soft);
  border-radius: var(--r-input);
  padding: 10px 12px;
}
</style>
