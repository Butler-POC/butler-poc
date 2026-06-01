// Created: 2026-05-30 11:27
import { api } from '@/api/client';
import type {
  Building,
  BuildingLedger,
  LedgerFields,
  Mortgage,
  RegistryFields,
} from '@/types/building';

export interface ParseResult {
  fields: RegistryFields;
}

export interface LedgerParseResult {
  fields: LedgerFields;
}

export interface SaveLedgerPayload extends Partial<LedgerFields> {
  source?: 'manual' | 'ocr';
  rawText?: string | null;
}

export interface CreateBuildingPayload extends Partial<RegistryFields> {
  address: string;
  mortgages?: Mortgage[];
  source?: 'manual' | 'ocr';
  rawText?: string | null;
}

/** 등기사항증명서 업로드 → 비전 구조화 추출 (저장 전) */
export function parseRegistry(file: File): Promise<ParseResult> {
  const form = new FormData();
  form.append('file', file);
  return api
    .post<ParseResult>('/buildings/parse', form, { params: { category: 'registry' } })
    .then((r) => r.data);
}

export function createBuilding(payload: CreateBuildingPayload): Promise<Building> {
  return api.post<Building>('/buildings', payload).then((r) => r.data);
}

export function listBuildings(): Promise<Building[]> {
  return api.get<Building[]>('/buildings').then((r) => r.data);
}

export function deleteBuilding(id: string): Promise<void> {
  return api.delete(`/buildings/${id}`).then(() => undefined);
}

/** L-02 — 건축물대장 업로드 → 비전 구조화 추출 (저장 전) */
export function parseLedger(file: File): Promise<LedgerParseResult> {
  const form = new FormData();
  form.append('file', file);
  return api
    .post<LedgerParseResult>('/buildings/ledger/parse', form, {
      params: { category: 'buildings' },
    })
    .then((r) => r.data);
}

/** L-02 — 건축물대장 등록/수정 (건물당 1건) */
export function saveLedger(
  buildingId: string,
  payload: SaveLedgerPayload,
): Promise<BuildingLedger> {
  return api
    .put<BuildingLedger>(`/buildings/${buildingId}/ledger`, payload)
    .then((r) => r.data);
}
