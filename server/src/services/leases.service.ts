// Created: 2026-05-31
import { prisma } from '../lib/prisma';
import { extractJSONFromMedia } from './llm.service';
import { LEASE_EXTRACT_PROMPT } from '../prompts/lease.prompt';
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
  return prisma.lease.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getLease(userId: string, id: string) {
  const lease = await prisma.lease.findFirst({ where: { id, userId } });
  if (!lease) throw new HttpError(404, '임차 건물을 찾을 수 없습니다.');
  return lease;
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
  const result = await prisma.lease.deleteMany({ where: { id, userId } });
  if (result.count === 0) throw new HttpError(404, '임차 건물을 찾을 수 없습니다.');
}
