// 하자(Issue) 도메인 타입
// T-02 하자 상담 / T-03 하자 제보(테넌트→오너)에서 사용.
// ⚠️ client/src/types 와 server/src/types 는 동일 내용 유지(shared 없음). 한쪽 수정 시 반드시 양쪽.

export type IssueStatus = 'reported' | 'reviewing' | 'resolved'; // 제보됨 / 검토중 / 처리완료

export type IssueCategory =
  | 'plumbing' // 수도/하수
  | 'electrical' // 전기
  | 'boiler' // 보일러/난방
  | 'waterproof' // 누수/방수
  | 'interior' // 내부 마감
  | 'appliance' // 빌트인 가전
  | 'other'; // 기타

export interface Issue {
  id: string;
  buildingId: string | null; // → Building (주소 매칭으로 해결. 미연결이면 null)
  leaseId?: string | null; // → Lease (제보 임차인 계약 출처)
  buildingAddress?: string | null; // 제보 대상 주소 (표시·참고)
  tenantId: string; // → 제보 임차인(User) id
  category: IssueCategory;
  description: string;
  photos?: string[]; // 업로드 파일 경로 (선택)
  proposedRepairRate: number; // 제안 수선비율 % (0–100)
  aiNeedsLandlord: boolean; // AI 판정: 임대인 분담/연락 필요 여부
  status: IssueStatus;
  createdAt: string; // ISO 8601
}

// T-03 제보 입력 — 임차인은 본인 계약(leaseId)을 보내고, 서버가 주소로 Building 을 연결한다.
// tenantId 는 서버에서 req.userId 로 보정. buildingId 직접 지정도 허용(선택).
export interface IssueReportInput {
  leaseId?: string;
  buildingId?: string;
  category: IssueCategory;
  description: string;
  proposedRepairRate: number;
  photos?: string[];
}

// repairRate.service 의 수선비율 판정 결과 (T-02 상담 / T-03 제보)
export interface RepairRateAssessment {
  repairRate: number; // AI 산정 수선비율 %
  needsLandlord: boolean; // 임대인 연락/분담 필요 여부
  rationale: string; // 근거 요약 (참고용 · 법적 효력 없음)
}
