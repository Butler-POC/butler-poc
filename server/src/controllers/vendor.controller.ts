// 수선 업체 컨트롤러 — L-05 수선 업체 조회
import type { Request, Response, NextFunction } from 'express';
import { searchVendors } from '../services/kakao.service';
import type { VendorCategory } from '../types';

const VALID_CATEGORIES: VendorCategory[] = ['boiler', 'aircon', 'cleaning', 'plumbing'];

// GET /api/vendors?category=&lat=&lng=&radius= — 건물 위치 기준 주변 업체
export async function listVendors(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, lat, lng, radius } = req.query;

    if (!category || !VALID_CATEGORIES.includes(category as VendorCategory)) {
      return res.status(400).json({ message: '유효한 category 가 필요합니다 (boiler/aircon/cleaning/plumbing).' });
    }
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (Number.isNaN(latNum) || Number.isNaN(lngNum)) {
      return res.status(400).json({ message: '건물 위치(lat, lng)가 필요합니다.' });
    }

    const vendors = await searchVendors({
      category: category as VendorCategory,
      lat: latNum,
      lng: lngNum,
      radius: radius ? Number(radius) : undefined,
    });
    res.json(vendors);
  } catch (err) {
    next(err);
  }
}
