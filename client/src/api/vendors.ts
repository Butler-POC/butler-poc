// 수선 업체 API 래퍼 — L-05
// './client' axios 인스턴스(baseURL '/api') 의 named export api 사용
import { api as http } from './client';
import type { Vendor, VendorCategory } from '@/types';

export function fetchVendors(params: {
  category: VendorCategory;
  lat: number;
  lng: number;
  radius?: number;
}): Promise<Vendor[]> {
  return http.get<Vendor[]>('/vendors', { params }).then((r) => r.data);
}
