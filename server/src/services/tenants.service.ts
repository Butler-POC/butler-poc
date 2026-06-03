// Created: 2026-05-31
import { prisma } from '../lib/prisma';
import { extractJSONFromMedia } from './llm.service';
import { CONTRACT_EXTRACT_PROMPT } from '../prompts/contract.prompt';
import { HttpError } from '../middleware/error';

/** 임대차계약서(L-03)에서 추출하는 필드 */
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

/** 임차인 등록 입력 (L-03) */
export interface CreateTenantInput extends Partial<ContractFields> {
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

function normalizeContract(f: Partial<ContractFields>): ContractFields {
  return {
    name: str(f.name),
    contact: str(f.contact),
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
 * 임대차계약서(이미지/PDF) → 구조화 필드. L-01·L-02 와 동일하게 비전으로 직접 분석한다.
 */
export async function parseContractFromMedia(
  base64: string,
  mediaType: string,
): Promise<ContractFields> {
  const fields = await extractJSONFromMedia<Partial<ContractFields>>(
    CONTRACT_EXTRACT_PROMPT,
    base64,
    mediaType,
  );
  return normalizeContract(fields);
}

/** 소유자 본인 건물인지 확인 (없으면 404) */
async function assertOwnsBuilding(ownerId: string, buildingId: string) {
  const building = await prisma.building.findFirst({
    where: { id: buildingId, ownerId },
    select: { id: true },
  });
  if (!building) throw new HttpError(404, '건물을 찾을 수 없습니다.');
}

/* ───────────────────────── L-04 월세 연체 판정 ───────────────────────── */

export type RentState = 'PAID' | 'OVERDUE' | 'UNKNOWN' | 'NO_RENT';

export interface RentStatus {
  state: RentState;
  dueMonth: string | null; // 납부 기준월 YYYY-MM (NO_RENT면 null)
  overdueMonths: number; // 연체 개월 수 (OVERDUE일 때만 > 0)
  lastPaidMonth: string | null;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** 오늘과 납부일 기준 "이번에 내야 할 달"(YYYY-MM)을 구한다. */
function computeDueMonth(paymentDay: number | null, now: Date): string {
  const pd = Math.min(31, Math.max(1, paymentDay ?? 1));
  let y = now.getFullYear();
  let m = now.getMonth(); // 0-based
  if (now.getDate() < pd) {
    // 아직 이번 달 납부일 전 → 직전 달이 납부 기준
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
  }
  return `${y}-${pad2(m + 1)}`;
}

function monthDiff(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

/** 임차인의 월세 납부 상태를 계산한다. (월세 없음=전세 → NO_RENT, 납부정보 없음 → UNKNOWN) */
export function rentState(
  t: {
    monthlyRent: number | null;
    paymentDay: number | null;
    lastPaidMonth: string | null;
  },
  now: Date = new Date(),
): RentStatus {
  if (!t.monthlyRent || t.monthlyRent <= 0) {
    return {
      state: 'NO_RENT',
      dueMonth: null,
      overdueMonths: 0,
      lastPaidMonth: t.lastPaidMonth,
    };
  }
  const dueMonth = computeDueMonth(t.paymentDay, now);
  if (!t.lastPaidMonth) {
    return { state: 'UNKNOWN', dueMonth, overdueMonths: 0, lastPaidMonth: null };
  }
  const diff = monthDiff(t.lastPaidMonth, dueMonth);
  if (diff <= 0) {
    return { state: 'PAID', dueMonth, overdueMonths: 0, lastPaidMonth: t.lastPaidMonth };
  }
  return {
    state: 'OVERDUE',
    dueMonth,
    overdueMonths: diff,
    lastPaidMonth: t.lastPaidMonth,
  };
}

export async function listTenants(ownerId: string, buildingId: string) {
  await assertOwnsBuilding(ownerId, buildingId);
  const now = new Date();
  const rows = await prisma.tenant.findMany({
    where: { buildingId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((t) => ({ ...t, rentStatus: rentState(t, now) }));
}

/** 임대인의 전 건물에서 현재 월세 연체(OVERDUE) 상태인 임차인을 모아 반환 */
export async function listOverdueTenants(ownerId: string) {
  const now = new Date();
  const rows = await prisma.tenant.findMany({
    where: { building: { ownerId } },
    include: {
      building: { select: { id: true, address: true, buildingName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return rows
    .map((t) => ({ t, rentStatus: rentState(t, now) }))
    .filter(({ rentStatus }) => rentStatus.state === 'OVERDUE')
    .map(({ t, rentStatus }) => ({
      id: t.id,
      buildingId: t.buildingId,
      buildingName: t.building.buildingName,
      address: t.building.address,
      name: t.name,
      unit: t.unit,
      contact: t.contact,
      monthlyRent: t.monthlyRent,
      paymentDay: t.paymentDay,
      rentStatus,
    }))
    // 연체 개월수 많은 순 → 같으면 이름순
    .sort((a, b) => {
      if (a.rentStatus.overdueMonths !== b.rentStatus.overdueMonths) {
        return b.rentStatus.overdueMonths - a.rentStatus.overdueMonths;
      }
      return a.name.localeCompare(b.name, 'ko');
    });
}

export async function createTenant(
  ownerId: string,
  buildingId: string,
  input: CreateTenantInput,
) {
  await assertOwnsBuilding(ownerId, buildingId);

  const f = normalizeContract(input);
  if (!f.name) throw new HttpError(400, '임차인 이름은 필수입니다.');

  const created = await prisma.tenant.create({
    data: {
      buildingId,
      ...f,
      name: f.name,
      source: input.source === 'ocr' ? 'ocr' : 'manual',
      rawText: str(input.rawText),
    },
  });
  return { ...created, rentStatus: rentState(created) };
}

export async function deleteTenant(
  ownerId: string,
  buildingId: string,
  id: string,
) {
  await assertOwnsBuilding(ownerId, buildingId);
  const result = await prisma.tenant.deleteMany({ where: { id, buildingId } });
  if (result.count === 0) throw new HttpError(404, '임차인을 찾을 수 없습니다.');
}

/** L-04 — 마지막 납부월 설정(납부 처리/취소). lastPaidMonth = "YYYY-MM" 또는 null. */
export async function setLastPaidMonth(
  ownerId: string,
  buildingId: string,
  tenantId: string,
  lastPaidMonth: string | null,
) {
  await assertOwnsBuilding(ownerId, buildingId);
  if (lastPaidMonth !== null && !/^\d{4}-\d{2}$/.test(lastPaidMonth)) {
    throw new HttpError(400, '월 형식이 올바르지 않습니다. (YYYY-MM)');
  }
  const existing = await prisma.tenant.findFirst({
    where: { id: tenantId, buildingId },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, '임차인을 찾을 수 없습니다.');

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { lastPaidMonth },
  });
  return { ...updated, rentStatus: rentState(updated) };
}
