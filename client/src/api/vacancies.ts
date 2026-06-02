// Created: 2026-05-31
import { api } from '@/api/client';
import type { VacancyWithOwner } from '@/types';

export type DealType = 'MONTHLY' | 'JEONSE';
export type VacancyStatus = 'OPEN' | 'CLOSED';

// A-01 — 공실 조회(임대인 정보 동반, 전체 건물 횡단) + 필터. (jh 슬라이스, 머지 시 추가)
export function fetchVacancies(params?: { status?: string; buildingId?: string }): Promise<VacancyWithOwner[]> {
  return api.get<VacancyWithOwner[]>('/vacancies', { params }).then((r) => r.data);
}

// A-02 — 채팅방 키 규약: 공실 + 에이전트 쌍 기준
export function vacancyRoomId(vacancyId: string, agentId: string): string {
  return `vacancy:${vacancyId}:agent:${agentId}`;
}

export interface Vacancy {
  id: string;
  buildingId: string;
  unit: string | null;
  dealType: DealType;
  deposit: number | null;
  monthlyRent: number | null;
  maintenanceFee: number | null;
  areaM2: number | null;
  floor: string | null;
  roomType: string | null;
  availableFrom: string | null;
  description: string | null;
  status: VacancyStatus;
  contact: string | null;
  createdAt: string;
}

export interface VacancyPayload {
  unit?: string | null;
  dealType?: DealType;
  deposit?: number | null;
  monthlyRent?: number | null;
  maintenanceFee?: number | null;
  areaM2?: number | null;
  floor?: string | null;
  roomType?: string | null;
  availableFrom?: string | null;
  description?: string | null;
  status?: VacancyStatus;
  contact?: string | null;
}

export function listVacancies(buildingId: string): Promise<Vacancy[]> {
  return api.get<Vacancy[]>(`/buildings/${buildingId}/vacancies`).then((r) => r.data);
}

export function createVacancy(
  buildingId: string,
  payload: VacancyPayload,
): Promise<Vacancy> {
  return api
    .post<Vacancy>(`/buildings/${buildingId}/vacancies`, payload)
    .then((r) => r.data);
}

export function updateVacancy(
  buildingId: string,
  vacancyId: string,
  payload: VacancyPayload,
): Promise<Vacancy> {
  return api
    .patch<Vacancy>(`/buildings/${buildingId}/vacancies/${vacancyId}`, payload)
    .then((r) => r.data);
}

export function deleteVacancy(
  buildingId: string,
  vacancyId: string,
): Promise<void> {
  return api
    .delete(`/buildings/${buildingId}/vacancies/${vacancyId}`)
    .then(() => undefined);
}
