// Created: 2026-05-31
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { uploadOcr } from '../middleware/upload';
import {
  create,
  detail,
  list,
  parse,
  remove,
} from '../controllers/leases.controller';

const router = Router();

// T-01 은 임차인 전용
router.use(requireAuth, requireRole('TENANT'));

router.post('/parse', uploadOcr, parse); // 임대차계약서 OCR 파싱 (저장 전)
router.get('/', list);
router.post('/', create);
router.get('/:id', detail);
router.delete('/:id', remove);

export default router;
