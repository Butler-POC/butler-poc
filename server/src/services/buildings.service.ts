// Created: 2026-05-30 11:26
import { prisma } from '../lib/prisma';
import { extractJSONFromMedia } from './llm.service';
import { rentState } from './tenants.service';
import { REGISTRY_EXTRACT_PROMPT } from '../prompts/registry.prompt';
import { LEDGER_EXTRACT_PROMPT } from '../prompts/ledger.prompt';
import { HttpError } from '../middleware/error';
import {
  CreateBuildingInput,
  LedgerFields,
  MortgageFields,
  RegistryFields,
  UpsertLedgerInput,
} from '../types/building';

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

function normalizeMortgage(m: Partial<MortgageFields>): MortgageFields {
  return {
    maxClaimAmount: num(m?.maxClaimAmount),
    creditor: str(m?.creditor),
    debtor: str(m?.debtor),
    establishedOn: str(m?.establishedOn),
  };
}

/** 빈 껍데기 항목은 제거 */
function normalizeMortgages(arr: unknown): MortgageFields[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(normalizeMortgage)
    .filter(
      (m) =>
        m.maxClaimAmount !== null || m.creditor || m.debtor || m.establishedOn,
    );
}

function normalize(f: Partial<RegistryFields>): RegistryFields {
  return {
    address: str(f.address),
    buildingName: str(f.buildingName),
    structure: str(f.structure),
    usage: str(f.usage),
    totalFloorArea: num(f.totalFloorArea),
    floors: str(f.floors),
    ownerName: str(f.ownerName),
    ownerShare: str(f.ownerShare),
    registryNo: str(f.registryNo),
    mortgages: normalizeMortgages(f.mortgages),
  };
}

/**
 * 등기사항증명서(이미지/PDF) → 구조화 필드.
 * 말소선(밑줄) 판별을 위해 **비전으로 직접 분석**한다.
 */
export async function parseRegistryFromMedia(
  base64: string,
  mediaType: string,
): Promise<RegistryFields> {
  const fields = await extractJSONFromMedia<Partial<RegistryFields>>(
    REGISTRY_EXTRACT_PROMPT,
    base64,
    mediaType,
  );
  return normalize(fields);
}

export async function createBuilding(ownerId: string, input: CreateBuildingInput) {
  const address = (input.address ?? '').trim();
  if (!address) throw new HttpError(400, '소재지(주소)는 필수입니다.');

  const mortgages = normalizeMortgages(input.mortgages);

  return prisma.building.create({
    data: {
      ownerId,
      address,
      buildingName: str(input.buildingName),
      structure: str(input.structure),
      usage: str(input.usage),
      totalFloorArea: num(input.totalFloorArea),
      floors: str(input.floors),
      ownerName: str(input.ownerName),
      ownerShare: str(input.ownerShare),
      registryNo: str(input.registryNo),
      source: input.source === 'ocr' ? 'ocr' : 'manual',
      rawText: str(input.rawText),
      mortgages: mortgages.length ? { create: mortgages } : undefined,
    },
    include: { mortgages: true },
  });
}

export async function listBuildings(ownerId: string) {
  const rows = await prisma.building.findMany({
    where: { ownerId },
    orderBy: { createdAt: 'desc' },
    include: {
      mortgages: true,
      ledger: true,
      tenants: {
        select: { monthlyRent: true, paymentDay: true, lastPaidMonth: true },
      },
      _count: { select: { tenants: true, vacancies: true } },
    },
  });

  // L-04 — 건물별 연체 임차인 수 계산 후 tenants 상세는 응답에서 제외
  const now = new Date();
  return rows.map((b) => {
    const overdueTenants = b.tenants.filter(
      (t) => rentState(t, now).state === 'OVERDUE',
    ).length;
    const { tenants, ...rest } = b;
    return { ...rest, overdueTenants };
  });
}

export async function getBuilding(ownerId: string, id: string) {
  const building = await prisma.building.findFirst({
    where: { id, ownerId },
    include: {
      mortgages: true,
      ledger: true,
      _count: { select: { tenants: true, vacancies: true } },
    },
  });
  if (!building) throw new HttpError(404, '건물을 찾을 수 없습니다.');
  return building;
}

export async function deleteBuilding(ownerId: string, id: string) {
  const result = await prisma.building.deleteMany({ where: { id, ownerId } });
  if (result.count === 0) throw new HttpError(404, '건물을 찾을 수 없습니다.');
}

/* ───────────────────────── L-02 건축물대장 ───────────────────────── */

function normalizeLedger(f: Partial<LedgerFields>): LedgerFields {
  return {
    siteAddress: str(f.siteAddress),
    lotNumber: str(f.lotNumber),
    buildingName: str(f.buildingName),
    landArea: num(f.landArea),
    buildingArea: num(f.buildingArea),
    totalFloorArea: num(f.totalFloorArea),
    buildingCoverageRatio: num(f.buildingCoverageRatio),
    floorAreaRatio: num(f.floorAreaRatio),
    mainStructure: str(f.mainStructure),
    mainUsage: str(f.mainUsage),
    floorsAbove: int(f.floorsAbove),
    floorsBelow: int(f.floorsBelow),
    height: num(f.height),
    households: str(f.households),
    parking: str(f.parking),
    approvalDate: str(f.approvalDate),
  };
}

/**
 * 건축물대장(이미지/PDF) → 구조화 필드. L-01 등기부와 동일하게 비전으로 직접 분석한다.
 */
export async function parseLedgerFromMedia(
  base64: string,
  mediaType: string,
): Promise<LedgerFields> {
  const fields = await extractJSONFromMedia<Partial<LedgerFields>>(
    LEDGER_EXTRACT_PROMPT,
    base64,
    mediaType,
  );
  return normalizeLedger(fields);
}

/** 소유자 본인 건물인지 확인 (없으면 404) */
async function assertOwnsBuilding(ownerId: string, buildingId: string) {
  const building = await prisma.building.findFirst({
    where: { id: buildingId, ownerId },
    select: { id: true },
  });
  if (!building) throw new HttpError(404, '건물을 찾을 수 없습니다.');
}

/** 건축물대장 등록/수정 (건물당 1건, upsert) */
export async function upsertLedger(
  ownerId: string,
  buildingId: string,
  input: UpsertLedgerInput,
) {
  await assertOwnsBuilding(ownerId, buildingId);

  const f = normalizeLedger(input);
  const source = input.source === 'ocr' ? 'ocr' : 'manual';
  const rawText = str(input.rawText);

  return prisma.buildingLedger.upsert({
    where: { buildingId },
    create: { buildingId, ...f, source, rawText },
    update: { ...f, source, rawText },
  });
}
