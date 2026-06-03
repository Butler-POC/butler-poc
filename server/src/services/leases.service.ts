// Created: 2026-05-31
import { prisma } from '../lib/prisma';
import { extractJSONFromMedia } from './llm.service';
import { LEASE_EXTRACT_PROMPT } from '../prompts/lease.prompt';
import { rentState } from './tenants.service';
import { HttpError } from '../middleware/error';

/** 임차 건물(임대차계약서, T-01)에서 추출하는 필드 */
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

/** 임차 건물 등록 입력 (T-01) */
export interface CreateLeaseInput extends Partial<LeaseFields> {
  source?: 'manual' | 'ocr';
  rawText?: string | null;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function num(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function int(v: unknown): number | null {
  const n = num(v);
  return n === null ? null : Math.trunc(n);
}

function normalizeLease(f: Partial<LeaseFields>): LeaseFields {
  return {
    address: str(f.address),
    buildingName: str(f.buildingName),
    unit: str(f.unit),
    lessorName: str(f.lessorName),
    deposit: num(f.deposit),
    monthlyRent: num(f.monthlyRent),
    maintenanceFee: num(f.maintenanceFee),
    paymentDay: int(f.paymentDay),
    leaseStart: str(f.leaseStart),
    leaseEnd: str(f.leaseEnd),
    contractDate: str(f.contractDate),
    specialTerms: str(f.specialTerms),
  };
}

/**
 * 임대차계약서(이미지/PDF) → 임차인 관점 구조화 필드. 비전으로 직접 분석한다.
 */
export async function parseLeaseFromMedia(
  base64: string,
  mediaType: string,
): Promise<LeaseFields> {
  const fields = await extractJSONFromMedia<Partial<LeaseFields>>(
    LEASE_EXTRACT_PROMPT,
    base64,
    mediaType,
  );
  return normalizeLease(fields);
}

export async function listLeases(userId: string) {
  const now = new Date();
  const rows = await prisma.lease.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((l) => ({ ...l, rentStatus: rentState(l, now) }));
}

export async function getLease(userId: string, id: string) {
  const lease = await prisma.lease.findFirst({ where: { id, userId } });
  if (!lease) throw new HttpError(404, '임차 건물을 찾을 수 없습니다.');
  return { ...lease, rentStatus: rentState(lease) };
}

/** 마지막 납부월 설정(납부 처리/취소). lastPaidMonth = "YYYY-MM" 또는 null. */
export async function setLastPaidMonth(
  userId: string,
  leaseId: string,
  lastPaidMonth: string | null,
) {
  if (lastPaidMonth !== null && !/^\d{4}-\d{2}$/.test(lastPaidMonth)) {
    throw new HttpError(400, '월 형식이 올바르지 않습니다. (YYYY-MM)');
  }
  const existing = await prisma.lease.findFirst({
    where: { id: leaseId, userId },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, '임차 건물을 찾을 수 없습니다.');

  const updated = await prisma.lease.update({
    where: { id: leaseId },
    data: { lastPaidMonth },
  });
  return { ...updated, rentStatus: rentState(updated) };
}

export async function createLease(userId: string, input: CreateLeaseInput) {
  const f = normalizeLease(input);
  if (!f.address) throw new HttpError(400, '임차 건물 주소는 필수입니다.');

  return prisma.lease.create({
    data: {
      userId,
      ...f,
      address: f.address,
      source: input.source === 'ocr' ? 'ocr' : 'manual',
      rawText: str(input.rawText),
    },
  });
}

export async function deleteLease(userId: string, id: string) {
  // 본인 계약인지 먼저 확인 (소유 검증)
  const lease = await prisma.lease.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!lease) throw new HttpError(404, '임차 건물을 찾을 수 없습니다.');

  // Issue 는 Lease 와 관계(FK cascade) 없이 scalar leaseId 로만 연결되므로,
  // 계약 삭제 시 이 계약에서 제보한 하자(T-03)도 함께 정리한다.
  await prisma.$transaction([
    prisma.issue.deleteMany({ where: { leaseId: id, tenantId: userId } }),
    prisma.lease.delete({ where: { id } }),
  ]);
}
