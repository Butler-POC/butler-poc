// Created: 2026-06-03 — 임차인 메인화면 전달사항(digest) 라우트
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { tenantDismiss, tenantList } from '../controllers/digest.controller';

const router = Router();

// 임차인 전용
router.use(requireAuth, requireRole('TENANT'));

router.get('/digest', tenantList);
router.post('/digest/dismiss', tenantDismiss);

export default router;
