// 공실(Vacancy) 도메인 타입
// A-01 공실 조회 / A-02 건물주 연결에서 사용. (L-07 공실 등록 제거됨)
// ⚠️ client/src/types 와 server/src/types 는 동일 내용 유지(shared 없음). 한쪽 수정 시 반드시 양쪽.

export type VacancyStatus = 'available' | 'closed'; // 모집중 / 마감

export interface Vacancy {
  id: string;
  buildingId: string; // → Building (기반, 팀원 담당 모델로 가정)
  unit: string; // 호/세대 (예: "302호")
  deposit: number; // 보증금 (₩)
  monthlyRent: number; // 월세 (₩)
  areaM2: number; // 전용면적 (㎡)
  description: string;
  status: VacancyStatus;
  createdAt: string; // ISO 8601
}

// A-01 조회 시 "빈 방 + 임대인 정보" 동반 (임대인 연결 진입점)
export interface VacancyWithOwner extends Vacancy {
  owner: {
    id: string; // → User (기반, 가정)
    name: string;
  };
  buildingAddress?: string;
}
