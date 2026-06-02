// 하자(Issue) 컨트롤러 — T-03 하자 제보(저장 + 임대인 연락) / 수신 목록
//
// 가정한 기반 인터페이스:
//   - '../lib/prisma' default export. prisma.issue / prisma.building(ownerId)
//   - '../sockets/chat.socket' 의 emitToUser(userId, event, payload) — 소켓 실시간 전달
//   - auth 미들웨어가 req.user = { id } 주입
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { AuthedRequest } from '../middleware/auth';
import { emitToUser } from '../sockets/chat.socket';
import { decideNeedsLandlord } from '../services/repairRate.service';
import type { IssueReportInput } from '../types';

// POST /api/issues — T-03 하자 제보
export async function createIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId;
    if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });

    const body = req.body as IssueReportInput;
    const required: (keyof IssueReportInput)[] = ['buildingId', 'category', 'description', 'proposedRepairRate'];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || body[key] === '') {
        return res.status(400).json({ message: `필수 항목이 누락되었습니다: ${key}` });
      }
    }

    const proposedRepairRate = Math.min(100, Math.max(0, Math.round(Number(body.proposedRepairRate))));
    // 수선비율 결정 AI 판정: 분담 비율 기반 임대인 연락 필요 여부
    const aiNeedsLandlord = decideNeedsLandlord(proposedRepairRate);

    const issue = await prisma.issue.create({
      data: {
        buildingId: body.buildingId,
        tenantId: body.tenantId ?? userId,
        category: body.category,
        description: body.description,
        photos: body.photos ?? undefined,
        proposedRepairRate,
        aiNeedsLandlord,
        status: 'reported',
      },
    });

    // 임대인 연락 필요 시 → 소유 임대인에게 실시간 알림(채팅 플럼빙 재사용)
    if (aiNeedsLandlord) {
      const building = await prisma.building.findUnique({
        where: { id: body.buildingId },
        select: { ownerId: true },
      });
      if (building?.ownerId) {
        emitToUser(building.ownerId, 'issue:reported', {
          issueId: issue.id,
          buildingId: issue.buildingId,
          category: issue.category,
          proposedRepairRate: issue.proposedRepairRate,
          description: issue.description,
          createdAt: issue.createdAt,
        });
      }
    }

    res.status(201).json(issue);
  } catch (err) {
    next(err);
  }
}

// GET /api/issues?mine=true — 임차인 본인 제보 이력
// GET /api/issues (임대인) — 내 건물에 접수된 하자 (수신함)
export async function listIssues(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId;
    if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });

    const { mine } = req.query;
    if (mine === 'true') {
      const issues = await prisma.issue.findMany({
        where: { tenantId: userId },
        orderBy: { createdAt: 'desc' },
      });
      return res.json(issues);
    }

    // 임대인 수신함: 본인 소유 건물의 하자
    const myBuildings = await prisma.building.findMany({ where: { ownerId: userId }, select: { id: true } });
    const issues = await prisma.issue.findMany({
      where: { buildingId: { in: myBuildings.map((b: { id: string }) => b.id) } },
      orderBy: [{ aiNeedsLandlord: 'desc' }, { createdAt: 'desc' }], // 연락 필요 건 상단
    });
    res.json(issues);
  } catch (err) {
    next(err);
  }
}
