// 공실 API 래퍼 — A-01 조회 / A-02 채팅방 키 (L-07 등록 API 제거됨)
// 가정: './client' 는 axios 인스턴스(baseURL '/api') default export
import http from './client';
import type { VacancyWithOwner } from '@/types';

// A-01 — 공실 조회(임대인 정보 동반) + 필터
export function fetchVacancies(params?: { status?: string; buildingId?: string }): Promise<VacancyWithOwner[]> {
  return http.get<VacancyWithOwner[]>('/vacancies', { params }).then((r) => r.data);
}

// A-02 — 채팅방 키 규약: 공실 + 에이전트 쌍 기준
export function vacancyRoomId(vacancyId: string, agentId: string): string {
  return `vacancy:${vacancyId}:agent:${agentId}`;
}
