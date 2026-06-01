// Created: 2026-05-31
import { api } from '@/api/client';

export type DealType = 'MONTHLY' | 'JEONSE';
export type VacancyStatus = 'OPEN' | 'CLOSED';

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
