// Created: 2026-06-03 — 임대인 메인화면 "오늘의 전달사항"
import { api } from '@/api/client';

export type NoticeType =
  | 'RENT_DUE'
  | 'LEASE_EXPIRING'
  | 'OVERDUE'
  | 'VACANT_UNREGISTERED';

export interface Notice {
  key: string;
  type: NoticeType;
  priority: 1 | 2 | 3 | 4;
  firstSeen: string;

  tenantId: string;
  buildingId: string;
  buildingName: string | null;
  address: string;
  unit: string | null;
  tenantName: string;

  monthlyRent?: number | null;
  dueDay?: number | null;
  daysUntil?: number;
  leaseEnd?: string;
  overdueMonths?: number;
  overdueAmount?: number;

  dismissible: boolean;
  canImplicitRenew?: boolean;
  canRegisterVacancy?: boolean;
}

/** 오늘의 전달사항 목록(정렬·삭제 반영됨) */
export function getDigest(): Promise<Notice[]> {
  return api.get<{ notices: Notice[] }>('/landlord/digest').then((r) => r.data.notices);
}

export interface OverdueRentStatus {
  state: 'OVERDUE';
  dueMonth: string | null;
  overdueMonths: number;
  lastPaidMonth: string | null;
}

export interface OverdueTenant {
  id: string;
  buildingId: string;
  buildingName: string | null;
  address: string | null;
  name: string;
  unit: string | null;
  contact: string | null;
  monthlyRent: number | null;
  paymentDay: number | null;
  rentStatus: OverdueRentStatus;
}

/** 현재 월세 연체 중인 임차인 종합 조회 */
export function getOverdueTenants(): Promise<OverdueTenant[]> {
  return api
    .get<{ tenants: OverdueTenant[] }>('/landlord/overdue-tenants')
    .then((r) => r.data.tenants);
}

/* ── 임차인 메인화면 전달사항 ── */

export type TenantNoticeType = 'OVERDUE' | 'RENT_DUE' | 'LEASE_EXPIRING';
export type LeaseExpiryPhase = 'NOTIFY' | 'RENEWAL_IMMINENT';

export interface TenantNotice {
  key: string;
  type: TenantNoticeType;
  priority: 1 | 2 | 3;
  firstSeen: string;

  leaseId: string;
  buildingName: string | null;
  address: string;
  unit: string | null;
  lessorName: string | null;

  monthlyRent?: number | null;
  dueDay?: number | null;
  overdueMonths?: number;
  overdueAmount?: number;
  lastPaidMonth?: string | null;
  daysUntil?: number;
  leaseEnd?: string;
  phase?: LeaseExpiryPhase;

  dismissible: boolean;
}

/** 임차인 오늘의 전달사항(정렬·삭제 반영됨) */
export function getTenantDigest(): Promise<TenantNotice[]> {
  return api.get<{ notices: TenantNotice[] }>('/tenant/digest').then((r) => r.data.notices);
}

/** 임차인 전달사항 삭제 */
export function dismissTenantNotice(noticeKey: string): Promise<void> {
  return api.post('/tenant/digest/dismiss', { noticeKey }).then(() => undefined);
}

/** 전달사항 삭제 */
export function dismissNotice(noticeKey: string): Promise<void> {
  return api.post('/landlord/digest/dismiss', { noticeKey }).then(() => undefined);
}

/** 묵시적 갱신 처리 */
export function implicitRenew(tenantId: string): Promise<void> {
  return api.post(`/landlord/tenants/${tenantId}/implicit-renew`).then(() => undefined);
}
