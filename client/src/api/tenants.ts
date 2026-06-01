// Created: 2026-05-31
import { api } from '@/api/client';

/** 임대차계약서(L-03) 추출 필드 */
export interface ContractFields {
  name: string | null;
  contact: string | null;
  unit: string | null;
  lessorName: string | null;
  deposit: number | null;
  monthlyRent: number | null;
  maintenanceFee: number | null;
  paymentDay: number | null;
  leaseStart: string | null;
  leaseEnd: string | null;
  contractDate: string | null;
  specialTerms: string | null;
}

export type RentState = 'PAID' | 'OVERDUE' | 'UNKNOWN' | 'NO_RENT';

export interface RentStatus {
  state: RentState;
  dueMonth: string | null;
  overdueMonths: number;
  lastPaidMonth: string | null;
}

export interface Tenant extends ContractFields {
  id: string;
  buildingId: string;
  source: 'manual' | 'ocr';
  createdAt: string;
  lastPaidMonth: string | null;
  rentStatus?: RentStatus;
}

export interface ContractParseResult {
  fields: ContractFields;
}

export interface CreateTenantPayload extends Partial<ContractFields> {
  source?: 'manual' | 'ocr';
  rawText?: string | null;
}

/** L-03 — 임대차계약서 업로드 → 비전 구조화 추출 (저장 전) */
export function parseContract(file: File): Promise<ContractParseResult> {
  const form = new FormData();
  form.append('file', file);
  return api
    .post<ContractParseResult>('/buildings/tenants/parse', form, {
      params: { category: 'contracts' },
    })
    .then((r) => r.data);
}

export function listTenants(buildingId: string): Promise<Tenant[]> {
  return api.get<Tenant[]>(`/buildings/${buildingId}/tenants`).then((r) => r.data);
}

export function createTenant(
  buildingId: string,
  payload: CreateTenantPayload,
): Promise<Tenant> {
  return api
    .post<Tenant>(`/buildings/${buildingId}/tenants`, payload)
    .then((r) => r.data);
}

export function deleteTenant(buildingId: string, tenantId: string): Promise<void> {
  return api
    .delete(`/buildings/${buildingId}/tenants/${tenantId}`)
    .then(() => undefined);
}

/** L-04 — 월세 마지막 납부월 설정(납부 처리/취소) */
export function setTenantRent(
  buildingId: string,
  tenantId: string,
  lastPaidMonth: string | null,
): Promise<Tenant> {
  return api
    .patch<Tenant>(`/buildings/${buildingId}/tenants/${tenantId}/rent`, {
      lastPaidMonth,
    })
    .then((r) => r.data);
}
