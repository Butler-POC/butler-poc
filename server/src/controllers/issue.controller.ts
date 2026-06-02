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

// 주소 정규화(공백·대소문자 제거) — 임차인 Lease 주소 ↔ 임대인 Building 주소 매칭 키
const normAddr = (s?: string | null) => (s ?? '').replace(/\s+/g, '').toLowerCase();

// 임차인 Lease 의 주소로 임대인 Building 을 찾아 연결 (POC: 주소 정규화 일치)
async function resolveBuilding(
  address: string | null,
): Promise<{ id: string; ownerId: string } | null> {
  const key = normAddr(address);
  if (!key) return null;
  const buildings = await prisma.building.findMany({ select: { id: true, address: true, ownerId: true } });
  const hit = buildings.find((b) => normAddr(b.address) === key);
  return hit ? { id: hit.id, ownerId: hit.ownerId } : null;
}

// POST /api/issues — T-03 하자 제보
//   임차인은 본인 계약(leaseId)을 보내고, 서버가 그 주소로 임대인 Building 을 연결한다.
export async function createIssue(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId;
    if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });

    const body = req.body as IssueReportInput;
    const required: (keyof IssueReportInput)[] = ['category', 'description', 'proposedRepairRate'];
    for (const key of required) {
      if (body[key] === undefined || body[key] === null || (body[key] as unknown) === '') {
        return res.status(400).json({ message: `필수 항목이 누락되었습니다: ${key}` });
      }
    }
    if (!body.leaseId && !body.buildingId) {
      return res.status(400).json({ message: '제보할 임차 건물(leaseId)이 필요합니다.' });
    }

    const proposedRepairRate = Math.min(100, Math.max(0, Math.round(Number(body.proposedRepairRate))));
    const aiNeedsLandlord = decideNeedsLandlord(proposedRepairRate);

    // 제보 대상 주소 확보: leaseId(임차인 본인 계약) 우선
    let leaseAddress: string | null = null;
    if (body.leaseId) {
      const lease = await prisma.lease.findFirst({
        where: { id: body.leaseId, userId }, // 본인 계약만 허용
        select: { address: true },
      });
      if (!lease) return res.status(404).json({ message: '임차 계약을 찾을 수 없습니다.' });
      leaseAddress = lease.address;
    }

    // 주소 매칭으로 임대인 Building 연결 (실패 시 buildingId=null → 임대인 수신함 비노출)
    let buildingId: string | null = body.buildingId ?? null;
    let ownerId: string | null = null;
    if (!buildingId) {
      const matched = await resolveBuilding(leaseAddress);
      if (matched) {
        buildingId = matched.id;
        ownerId = matched.ownerId;
      }
    } else {
      const b = await prisma.building.findUnique({ where: { id: buildingId }, select: { ownerId: true } });
      ownerId = b?.ownerId ?? null;
    }

    const issue = await prisma.issue.create({
      data: {
        buildingId,
        leaseId: body.leaseId ?? null,
        buildingAddress: leaseAddress,
        tenantId: userId,
        category: body.category,
        description: body.description,
        photos: body.photos ?? undefined,
        proposedRepairRate,
        aiNeedsLandlord,
        status: 'reported',
      },
    });

    // 임대인 연결 + 연락 필요 시 → 소유 임대인에게 실시간 알림
    if (buildingId && ownerId && aiNeedsLandlord) {
      emitToUser(ownerId, 'issue:reported', {
        issueId: issue.id,
        buildingId: issue.buildingId,
        buildingAddress: issue.buildingAddress,
        category: issue.category,
        proposedRepairRate: issue.proposedRepairRate,
        description: issue.description,
        createdAt: issue.createdAt,
      });
    }

    // linked: 임대인 Building 연결 여부 — 클라가 안내에 사용
    res.status(201).json({ ...issue, linked: Boolean(buildingId) });
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
