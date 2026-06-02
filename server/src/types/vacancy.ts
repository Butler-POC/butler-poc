// 공실(Vacancy) 도메인 타입 — jg(기반) 모델 기준으로 통합
// A-01 공실 조회 / A-02 건물주 연결에서 사용.
// ⚠️ client/src/types 와 server/src/types 는 동일 내용 유지(shared 없음). 한쪽 수정 시 반드시 양쪽.

export type DealType = 'MONTHLY' | 'JEONSE'; // 월세 / 전세
export type VacancyStatus = 'OPEN' | 'CLOSED'; // 모집중 / 마감

export interface Vacancy {
  id: string;
  buildingId: string; // → Building
  unit: string | null; // 동/호
  dealType: DealType;
  deposit: number | null; // 보증금(원)
  monthlyRent: number | null; // 월세(원) — 전세면 null
  maintenanceFee: number | null; // 관리비(원)
  areaM2: number | null; // 전용면적(㎡)
  floor: string | null; // 층
  roomType: string | null; // 구조 (예: 원룸/투룸)
  availableFrom: string | null; // 입주 가능일
  description: string | null;
  status: VacancyStatus;
  contact: string | null; // 문의 연락처
  createdAt: string; // ISO 8601
}

// A-01 조회 시 "빈 방 + 임대인 정보" 동반 (임대인 연결 진입점)
export interface VacancyWithOwner extends Vacancy {
  owner: {
    id: string; // → User
    name: string;
  };
  buildingAddress?: string;
}
