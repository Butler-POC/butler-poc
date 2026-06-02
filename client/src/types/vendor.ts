// 수선 업체(Vendor) 도메인 타입 — L-05 수선 업체 조회
// 카카오 로컬 검색 결과를 가공한 형태(비영속 — DB 저장 안 함).
// ⚠️ client/src/types 와 server/src/types 동일 유지.

export type VendorCategory = 'boiler' | 'aircon' | 'cleaning' | 'plumbing';

export interface Vendor {
  id: string; // 카카오 place id
  name: string;
  category: VendorCategory; // 검색에 사용한 분류
  phone?: string;
  address?: string; // 지번 주소
  roadAddress?: string; // 도로명 주소
  lat: number; // 위도 (y)
  lng: number; // 경도 (x)
  distance?: number; // 건물 기준 거리(m)
  placeUrl?: string; // 카카오플레이스 상세 URL
}
