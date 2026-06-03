// Created: 2026-06-03 — 임대인 메인화면 전달사항(digest) 라우트
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { dismiss, implicitRenew, list, overdueTenants } from '../controllers/digest.controller';

const router = Router();

// 임대인 전용
router.use(requireAuth, requireRole('LANDLORD'));

router.get('/digest', list);
router.get('/overdue-tenants', overdueTenants);
router.post('/digest/dismiss', dismiss);
router.post('/tenants/:tenantId/implicit-renew', implicitRenew);

export default router;
