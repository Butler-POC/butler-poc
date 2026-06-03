// Created: 2026-05-31
import { api } from '@/api/client';
import type { RentStatus } from '@/api/tenants';

/** 임차 건물(임대차계약서, T-01) 필드 */
export interface LeaseFields {
  address: string | null;
  buildingName: string | null;
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

export interface Lease extends LeaseFields {
  id: string;
  source: 'manual' | 'ocr';
  createdAt: string;
  lastPaidMonth: string | null;
  rentStatus?: RentStatus;
}

export interface LeaseParseResult {
  fields: LeaseFields;
}

export interface CreateLeasePayload extends Partial<LeaseFields> {
  address: string;
  source?: 'manual' | 'ocr';
  rawText?: string | null;
}

/** T-01 — 임대차계약서 업로드 → 비전 구조화 추출 (저장 전) */
export function parseLease(file: File): Promise<LeaseParseResult> {
  const form = new FormData();
  form.append('file', file);
  return api
    .post<LeaseParseResult>('/leases/parse', form, {
      params: { category: 'contracts' },
    })
    .then((r) => r.data);
}

export function createLease(payload: CreateLeasePayload): Promise<Lease> {
  return api.post<Lease>('/leases', payload).then((r) => r.data);
}

export function listLeases(): Promise<Lease[]> {
  return api.get<Lease[]>('/leases').then((r) => r.data);
}

export function deleteLease(id: string): Promise<void> {
  return api.delete(`/leases/${id}`).then(() => undefined);
}

/** 월세 마지막 납부월 설정(납부 처리/취소) */
export function setLeaseRent(id: string, lastPaidMonth: string | null): Promise<Lease> {
  return api
    .patch<Lease>(`/leases/${id}/rent`, { lastPaidMonth })
    .then((r) => r.data);
}
