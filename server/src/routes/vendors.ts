// 수선 업체 라우트 — L-05 수선 업체 조회
// ⚠️ 기반 app.ts 에 등록 필요(머지 시): app.use('/api/vendors', vendorsRouter)
import { Router } from 'express';
import { listVendors } from '../controllers/vendor.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listVendors); // L-05 (임대인)

export default router;
