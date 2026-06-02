// Created: 2026-05-30 11:25
/** 근저당권 (등기 을구) — 말소되지 않은 유효 항목 */
export interface MortgageFields {
  maxClaimAmount: number | null;
  creditor: string | null;
  debtor: string | null;
  establishedOn: string | null;
}

/** 등기사항증명서에서 추출하는 필드 */
export interface RegistryFields {
  address: string | null;
  buildingName: string | null;
  structure: string | null;
  usage: string | null;
  totalFloorArea: number | null;
  floors: string | null;
  ownerName: string | null;
  ownerShare: string | null;
  registryNo: string | null;
  mortgages: MortgageFields[];
}

/** 건축물대장(L-02)에서 추출하는 필드 */
export interface LedgerFields {
  siteAddress: string | null;
  lotNumber: string | null;
  buildingName: string | null;
  landArea: number | null;
  buildingArea: number | null;
  totalFloorArea: number | null;
  buildingCoverageRatio: number | null;
  floorAreaRatio: number | null;
  mainStructure: string | null;
  mainUsage: string | null;
  floorsAbove: number | null;
  floorsBelow: number | null;
  height: number | null;
  households: string | null;
  parking: string | null;
  approvalDate: string | null;
}

/** 건축물대장 등록/수정 입력 (L-02) */
export interface UpsertLedgerInput extends Partial<LedgerFields> {
  source?: 'manual' | 'ocr';
  rawText?: string | null;
}

/** 건물 등록 입력 */
export interface CreateBuildingInput {
  address: string;
  buildingName?: string | null;
  structure?: string | null;
  usage?: string | null;
  totalFloorArea?: number | null;
  floors?: string | null;
  ownerName?: string | null;
  ownerShare?: string | null;
  registryNo?: string | null;
  mortgages?: MortgageFields[];
  source?: 'manual' | 'ocr';
  rawText?: string | null;
}
