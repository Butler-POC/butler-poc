// Created: 2026-05-31
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/error';

/** 공실 등록/수정 입력 (L-07) */
export interface VacancyInput {
  unit?: string | null;
  dealType?: string | null; // "MONTHLY" | "JEONSE"
  deposit?: number | null;
  monthlyRent?: number | null;
  maintenanceFee?: number | null;
  areaM2?: number | null;
  floor?: string | null;
  roomType?: string | null;
  availableFrom?: string | null;
  description?: string | null;
  status?: string | null; // "OPEN" | "CLOSED"
  contact?: string | null;
}

const DEAL_TYPES = ['MONTHLY', 'JEONSE'] as const;
const STATUSES = ['OPEN', 'CLOSED'] as const;

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function num(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function dealType(v: unknown): string {
  const s = String(v ?? '').toUpperCase();
  return (DEAL_TYPES as readonly string[]).includes(s) ? s : 'MONTHLY';
}

function status(v: unknown): string {
  const s = String(v ?? '').toUpperCase();
  return (STATUSES as readonly string[]).includes(s) ? s : 'OPEN';
}

/** 소유자 본인 건물인지 확인 (없으면 404) */
async function assertOwnsBuilding(ownerId: string, buildingId: string) {
  const building = await prisma.building.findFirst({
    where: { id: buildingId, ownerId },
    select: { id: true },
  });
  if (!building) throw new HttpError(404, '건물을 찾을 수 없습니다.');
}

export async function listVacancies(ownerId: string, buildingId: string) {
  await assertOwnsBuilding(ownerId, buildingId);
  return prisma.vacancy.findMany({
    where: { buildingId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createVacancy(
  ownerId: string,
  buildingId: string,
  input: VacancyInput,
) {
  await assertOwnsBuilding(ownerId, buildingId);
  return prisma.vacancy.create({
    data: {
      buildingId,
      unit: str(input.unit),
      dealType: dealType(input.dealType),
      deposit: num(input.deposit),
      monthlyRent: num(input.monthlyRent),
      maintenanceFee: num(input.maintenanceFee),
      areaM2: num(input.areaM2),
      floor: str(input.floor),
      roomType: str(input.roomType),
      availableFrom: str(input.availableFrom),
      description: str(input.description),
      status: status(input.status),
      contact: str(input.contact),
    },
  });
}

export async function updateVacancy(
  ownerId: string,
  buildingId: string,
  id: string,
  input: VacancyInput,
) {
  await assertOwnsBuilding(ownerId, buildingId);
  const existing = await prisma.vacancy.findFirst({
    where: { id, buildingId },
    select: { id: true },
  });
  if (!existing) throw new HttpError(404, '공실을 찾을 수 없습니다.');

  // 전달된 필드만 갱신 (status 토글 등 부분 수정 지원)
  const data: Record<string, unknown> = {};
  if ('unit' in input) data.unit = str(input.unit);
  if ('dealType' in input) data.dealType = dealType(input.dealType);
  if ('deposit' in input) data.deposit = num(input.deposit);
  if ('monthlyRent' in input) data.monthlyRent = num(input.monthlyRent);
  if ('maintenanceFee' in input) data.maintenanceFee = num(input.maintenanceFee);
  if ('areaM2' in input) data.areaM2 = num(input.areaM2);
  if ('floor' in input) data.floor = str(input.floor);
  if ('roomType' in input) data.roomType = str(input.roomType);
  if ('availableFrom' in input) data.availableFrom = str(input.availableFrom);
  if ('description' in input) data.description = str(input.description);
  if ('status' in input) data.status = status(input.status);
  if ('contact' in input) data.contact = str(input.contact);

  return prisma.vacancy.update({ where: { id }, data });
}

export async function deleteVacancy(
  ownerId: string,
  buildingId: string,
  id: string,
) {
  await assertOwnsBuilding(ownerId, buildingId);
  const result = await prisma.vacancy.deleteMany({ where: { id, buildingId } });
  if (result.count === 0) throw new HttpError(404, '공실을 찾을 수 없습니다.');
}
