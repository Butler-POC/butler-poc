// 채팅 컨트롤러 (C-02) — POST /api/chat 디스패처 + 모드별 LLM 핸들러
//   general → 일반 챗봇 / legal → L-06 법률 상담 / repair → T-02 하자 상담
//
// 실제 의존(C-02 구현됨):
//   - '../services/chat.service' 의 chat({ system, messages }) => Promise<string> (단일 LLM/Claude)
// 가정한 기반 인터페이스(팀원 담당):
//   - '../lib/prisma' default export. prisma.building(ownerId), building.tenants / prisma.tenant 관계.
//   - auth 미들웨어가 req.user = { id, name? } 주입.
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { AuthedRequest } from '../middleware/auth';
import { chat } from '../services/chat.service';
import { BASE_BUTLER_SYSTEM } from '../prompts/chat.prompt';
import { buildLegalSystemPrompt, LEGAL_DISCLAIMER, type LegalContext } from '../prompts/legal.prompt';
import {
  buildRepairChatSystemPrompt,
  REPAIR_DISCLAIMER,
  type RepairContext,
} from '../prompts/repairRate.prompt';
import { assessRepairRate } from '../services/repairRate.service';
import type { ChatMessage } from '../types';

// 임대인 본인 데이터를 LegalContext 로 합성
async function buildOwnerLegalContext(ownerId: string, ownerName?: string): Promise<LegalContext> {
  const buildings = await prisma.building.findMany({
    where: { ownerId },
    include: { tenants: true }, // 기반 Building→Tenant 관계 가정
  });

  return {
    ownerName,
    buildings: (buildings ?? []).map((b: any) => ({
      address: b.address ?? '주소 미상',
      tenants: (b.tenants ?? []).map((t: any) => ({
        name: t.name,
        unit: t.unit,
        deposit: t.deposit,
        monthlyRent: t.monthlyRent,
        leasePeriod:
          t.leaseStart && t.leaseEnd ? `${t.leaseStart} ~ ${t.leaseEnd}` : t.leasePeriod ?? undefined,
        overdue: t.overdue ?? t.isOverdue ?? false, // L-04 연체 플래그(필드명 미확정 대비)
        specialTerms: t.specialTerms ?? t.specialTerm ?? undefined, // T-01 특약사항
      })),
    })),
  };
}

// POST /api/chat (mode: 'legal') — L-06 간단 법률 상담
export async function legalChat(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId;
    if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });

    const { message, history } = req.body as { message?: string; history?: ChatMessage[] };
    if (!message || !message.trim()) {
      return res.status(400).json({ message: '질문 내용을 입력해 주세요.' });
    }

    const context = await buildOwnerLegalContext(userId);
    const system = buildLegalSystemPrompt(context);

    const messages: ChatMessage[] = [
      ...(Array.isArray(history) ? history.slice(-10) : []), // 최근 10턴만 전달
      { role: 'user', content: message },
    ];

    const reply = await chat({ system, messages });

    res.json({ reply, disclaimer: LEGAL_DISCLAIMER });
  } catch (err) {
    next(err);
  }
}

// 임차인 본인의 임차 건물·특약 맥락 조회
async function buildTenantRepairContext(
  userId: string,
  extra: { category?: string; description?: string },
): Promise<RepairContext> {
  // 임차인 본인 계약은 jg의 Lease 모델(userId 1:N, T-01). 최신 계약을 맥락으로 사용.
  const lease = await prisma.lease.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return {
    buildingAddress: lease?.address ?? undefined,
    unit: lease?.unit ?? undefined,
    specialTerms: lease?.specialTerms ?? undefined,
    category: extra.category,
    description: extra.description,
  };
}

// POST /api/chat (mode: 'repair') — T-02 하자 상담 (상담 응답 + 수선비율 판정 동반)
export async function repairChat(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId;
    if (!userId) return res.status(401).json({ message: '로그인이 필요합니다.' });

    const { message, history, category, description } = req.body as {
      message?: string;
      history?: ChatMessage[];
      category?: string;
      description?: string;
    };
    if (!message || !message.trim()) {
      return res.status(400).json({ message: '상담 내용을 입력해 주세요.' });
    }

    const context = await buildTenantRepairContext(userId, {
      category,
      description: description ?? message,
    });

    const system = buildRepairChatSystemPrompt(context);
    const messages: ChatMessage[] = [
      ...(Array.isArray(history) ? history.slice(-10) : []),
      { role: 'user', content: message },
    ];

    // 상담 응답 + 수선비율 판정 병렬 수행
    const [reply, assessment] = await Promise.all([
      chat({ system, messages }),
      assessRepairRate(context),
    ]);

    res.json({ reply, assessment, disclaimer: REPAIR_DISCLAIMER });
  } catch (err) {
    next(err);
  }
}

// POST /api/chat (mode: 'general' 또는 미지정) — 일반 챗봇 (C-02 기본)
export async function generalChat(req: Request, res: Response, next: NextFunction) {
  try {
    const { message, history } = req.body as { message?: string; history?: ChatMessage[] };
    if (!message || !message.trim()) {
      return res.status(400).json({ message: '메시지를 입력해 주세요.' });
    }
    const messages: ChatMessage[] = [
      ...(Array.isArray(history) ? history.slice(-10) : []),
      { role: 'user', content: message },
    ];
    const reply = await chat({ system: BASE_BUTLER_SYSTEM, messages });
    res.json({ reply });
  } catch (err) {
    next(err);
  }
}

// POST /api/chat — mode 로 분기하는 디스패처 (C-02)
export function postChat(req: Request, res: Response, next: NextFunction) {
  const mode = (req.body?.mode as string | undefined) ?? 'general';
  switch (mode) {
    case 'legal':
      return legalChat(req, res, next);
    case 'repair':
      return repairChat(req, res, next);
    case 'general':
      return generalChat(req, res, next);
    default:
      return res.status(400).json({ message: `알 수 없는 mode 입니다: ${mode}` });
  }
}
