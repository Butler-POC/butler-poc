// 공실(Vacancy) 라우트 — A-01 조회 (L-07 등록 라우트 제거됨)
// ⚠️ 기반 app.ts 에 다음 등록 필요(머지 시): app.use('/api/vacancies', vacanciesRouter)
import { Router } from 'express';
import { listVacancies } from '../controllers/vacancy.controller';

const router = Router();

router.get('/', listVacancies); // A-01 공실 조회

export default router;
