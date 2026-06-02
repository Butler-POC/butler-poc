// Created: 2026-05-30 11:27
export interface Mortgage {
  maxClaimAmount: number | null;
  creditor: string | null;
  debtor: string | null;
  establishedOn: string | null;
}

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
  mortgages: Mortgage[];
}

/** L-02 건축물대장 필드 */
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

export interface BuildingLedger extends LedgerFields {
  id: string;
  buildingId: string;
  source: 'manual' | 'ocr';
  createdAt: string;
}

export interface Building extends RegistryFields {
  id: string;
  source: 'manual' | 'ocr';
  createdAt: string;
  ledger?: BuildingLedger | null;
  _count?: { tenants: number; vacancies: number };
  overdueTenants?: number; // L-04 연체 임차인 수
}
