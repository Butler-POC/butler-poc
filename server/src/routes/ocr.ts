// Created: 2026-05-30 10:05
import { Router } from 'express';
import { uploadOcr } from '../middleware/upload';
import { scan, health } from '../controllers/ocr.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/health', health);
router.post('/scan', requireAuth, uploadOcr, scan);

export default router;
