// 공실(Vacancy) 컨트롤러 — A-01 공실 조회
// (L-07 공실 등록 기능은 제거됨. A-01·A-02 가 공유하는 조회만 유지)
//
// 가정한 기반 인터페이스 (팀원 담당, 머지 시 정합):
//   - '../lib/prisma' : PrismaClient 인스턴스 default export. prisma.building(Building 모델) 사용.
//   - Building 모델 : { id, address, ownerId, owner: User } (scalar FK buildingId 로 Vacancy 와 연결)
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import type { VacancyWithOwner } from '../types';

// GET /api/vacancies — A-01 공실 조회(임대인 정보 동반) + 필터
//   query: status=available|closed | buildingId
export async function listVacancies(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, buildingId } = req.query;
    const where: Record<string, unknown> = {};

    if (status) where.status = String(status);
    if (buildingId) where.buildingId = String(buildingId);

    const vacancies = await prisma.vacancy.findMany({ where, orderBy: { createdAt: 'desc' } });

    // A-01: 빈 방 + 임대인 정보 동반 가공 (건물 → owner 관계 가정)
    const buildingIds = [...new Set(vacancies.map((v: { buildingId: string }) => v.buildingId))];
    const buildings = await prisma.building.findMany({
      where: { id: { in: buildingIds } },
      include: { owner: true },
    });
    const byId = new Map(buildings.map((b: { id: string }) => [b.id, b]));

    const enriched: VacancyWithOwner[] = vacancies.map((v: Record<string, any>) => {
      const b = byId.get(v.buildingId) as { address?: string; owner?: { id: string; name: string } } | undefined;
      return {
        ...(v as VacancyWithOwner),
        buildingAddress: b?.address,
        owner: { id: b?.owner?.id ?? '', name: b?.owner?.name ?? '임대인' },
      };
    });

    res.json(enriched);
  } catch (err) {
    next(err);
  }
}
