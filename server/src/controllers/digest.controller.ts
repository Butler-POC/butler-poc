// Created: 2026-06-03 — 임대인 메인화면 전달사항(digest)
import { NextFunction, Request, Response } from 'express';
import * as digest from '../services/digest.service';
import { listOverdueTenants } from '../services/tenants.service';
import { AuthedRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';

/** GET /api/landlord/digest — 오늘의 전달사항 목록 */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    res.json({ notices: await digest.buildDigest(ownerId) });
  } catch (e) {
    next(e);
  }
}

/** POST /api/landlord/digest/dismiss — 전달사항 삭제 { noticeKey } */
export async function dismiss(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    const noticeKey = (req.body?.noticeKey ?? '').toString().trim();
    if (!noticeKey) throw new HttpError(400, 'noticeKey 가 필요합니다.');
    await digest.dismissNotice(ownerId, noticeKey);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

/** GET /api/landlord/overdue-tenants — 현재 월세 연체 중인 임차인 종합 조회 */
export async function overdueTenants(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    res.json({ tenants: await listOverdueTenants(ownerId) });
  } catch (e) {
    next(e);
  }
}

/** POST /api/landlord/tenants/:tenantId/implicit-renew — 묵시적 갱신 처리 */
export async function implicitRenew(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    await digest.markImplicitRenew(ownerId, req.params.tenantId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

/* ── 임차인 메인화면 전달사항 ── */

/** GET /api/tenant/digest — 임차인 오늘의 전달사항 */
export async function tenantList(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId!;
    res.json({ notices: await digest.buildTenantDigest(userId) });
  } catch (e) {
    next(e);
  }
}

/** POST /api/tenant/digest/dismiss — 전달사항 삭제 { noticeKey } */
export async function tenantDismiss(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId!;
    const noticeKey = (req.body?.noticeKey ?? '').toString().trim();
    if (!noticeKey) throw new HttpError(400, 'noticeKey 가 필요합니다.');
    await digest.dismissNotice(userId, noticeKey);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
