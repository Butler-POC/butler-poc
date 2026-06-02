// 챗봇(C-02) 라우트 — POST /api/chat (mode 로 분기)
// ⚠️ 기반 app.ts 에 등록 필요(머지 시): app.use('/api/chat', chatRouter)
// 실시간 스트리밍이 필요하면 sockets/chat.socket.ts 로 별도 전달(요청-응답은 이 라우트).
import { Router } from 'express';
import { postChat } from '../controllers/chat.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, postChat); // mode: general | legal | repair

export default router;
