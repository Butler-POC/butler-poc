// 공실 스토어 (Pinia) — A-01 조회 (L-07 등록·내 목록 제거됨)
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { VacancyWithOwner } from '@/types';
import * as api from '@/api/vacancies';

export const useVacanciesStore = defineStore('vacancies', () => {
  const listing = ref<VacancyWithOwner[]>([]); // A-01 조회 결과
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadListing(params?: { status?: string; buildingId?: string }) {
    loading.value = true;
    error.value = null;
    try {
      listing.value = await api.fetchVacancies(params);
    } catch (e) {
      error.value = '공실을 불러오지 못했습니다. 다시 시도해 주세요.';
    } finally {
      loading.value = false;
    }
  }

  return { listing, loading, error, loadListing };
});
