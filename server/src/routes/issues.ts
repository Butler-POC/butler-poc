// 하자(Issue) 라우트 — T-03 제보 / 수신·이력 조회
// ⚠️ 기반 app.ts 에 등록 필요(머지 시): app.use('/api/issues', issuesRouter)
import { Router } from 'express';
import { createIssue, listIssues } from '../controllers/issue.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listIssues); // 임대인 수신함 / mine=true 임차인 이력
router.post('/', requireAuth, createIssue); // T-03 하자 제보

export default router;
