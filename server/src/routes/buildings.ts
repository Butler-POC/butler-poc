// Created: 2026-05-30 11:08
import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { uploadOcr } from '../middleware/upload';
import {
  create,
  detail,
  list,
  parse,
  parseLedger,
  remove,
  saveLedger,
} from '../controllers/buildings.controller';
import * as tenantCtrl from '../controllers/tenants.controller';
import * as vacancyCtrl from '../controllers/vacancies.controller';

const router = Router();

// L-01·L-02·L-03 은 임대인 전용
router.use(requireAuth, requireRole('LANDLORD'));

router.post('/parse', uploadOcr, parse); // 등기부등본 OCR 파싱 (저장 전)
router.post('/ledger/parse', uploadOcr, parseLedger); // L-02 건축물대장 OCR 파싱 (저장 전)
router.post('/tenants/parse', uploadOcr, tenantCtrl.parseContract); // L-03 임대차계약서 OCR 파싱 (저장 전)
router.get('/', list);
router.post('/', create);
router.get('/:id', detail);
router.delete('/:id', remove);
router.put('/:id/ledger', saveLedger); // L-02 건축물대장 등록/수정

// L-03 임차인 (건물별)
router.get('/:id/tenants', tenantCtrl.list);
router.post('/:id/tenants', tenantCtrl.create);
router.delete('/:id/tenants/:tenantId', tenantCtrl.remove);
router.patch('/:id/tenants/:tenantId/rent', tenantCtrl.setRent); // L-04 월세 납부월 설정

// L-07 공실 (건물별)
router.get('/:id/vacancies', vacancyCtrl.list);
router.post('/:id/vacancies', vacancyCtrl.create);
router.patch('/:id/vacancies/:vacancyId', vacancyCtrl.update);
router.delete('/:id/vacancies/:vacancyId', vacancyCtrl.remove);

export default router;
