// Kakao 로컬(키워드) 검색 서비스 — L-05 수선 업체 조회
// 서버 전용 REST 키(.env KAKAO_REST_KEY) 사용. JS 키와 혼용 금지.
// [자료조사 메모] 카카오 카테고리 코드(CT1 등)는 수선 업종을 정확히 못 잡아, 키워드 검색으로 구현.
// 런타임: Node 18+ 전역 fetch 사용.
import type { Vendor, VendorCategory } from '../types';

const KAKAO_KEYWORD_URL = 'https://dapi.kakao.com/v2/local/search/keyword.json';

// 분류 → 검색 키워드 (보일러 / 에어컨 / 입주청소 / 하수도)
const CATEGORY_KEYWORD: Record<VendorCategory, string> = {
  boiler: '보일러 수리',
  aircon: '에어컨 설치 수리',
  cleaning: '입주청소',
  plumbing: '하수구 정비',
};

interface KakaoDoc {
  id: string;
  place_name: string;
  phone?: string;
  address_name?: string;
  road_address_name?: string;
  x: string; // 경도 lng
  y: string; // 위도 lat
  distance?: string;
  place_url?: string;
}

export interface VendorSearchParams {
  category: VendorCategory;
  lat: number; // y
  lng: number; // x
  radius?: number; // m (최대 20000)
  size?: number; // 최대 15
}

export async function searchVendors(params: VendorSearchParams): Promise<Vendor[]> {
  const key = process.env.KAKAO_REST_KEY;
  if (!key) throw new Error('KAKAO_REST_KEY 가 설정되지 않았습니다.');

  const keyword = CATEGORY_KEYWORD[params.category];
  const url = new URL(KAKAO_KEYWORD_URL);
  url.searchParams.set('query', keyword);
  url.searchParams.set('x', String(params.lng));
  url.searchParams.set('y', String(params.lat));
  url.searchParams.set('radius', String(Math.min(params.radius ?? 5000, 20000)));
  url.searchParams.set('sort', 'distance');
  url.searchParams.set('size', String(Math.min(params.size ?? 15, 15)));

  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Kakao 로컬 검색 실패 (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { documents?: KakaoDoc[] };
  return (data.documents ?? []).map((d) => ({
    id: d.id,
    name: d.place_name,
    category: params.category,
    phone: d.phone || undefined,
    address: d.address_name || undefined,
    roadAddress: d.road_address_name || undefined,
    lat: Number(d.y),
    lng: Number(d.x),
    distance: d.distance ? Number(d.distance) : undefined,
    placeUrl: d.place_url || undefined,
  }));
}
