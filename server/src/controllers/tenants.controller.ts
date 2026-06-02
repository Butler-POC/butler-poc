// Created: 2026-05-31
import fs from 'fs/promises';
import { NextFunction, Request, Response } from 'express';
import * as tenants from '../services/tenants.service';
import { AuthedRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';

/**
 * POST /api/buildings/tenants/parse — 임대차계약서 업로드 → 비전 구조화 추출 (저장 X, L-03)
 */
export async function parseContract(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.file) {
      throw new HttpError(400, '업로드된 파일이 없습니다. (form-data field: "file")');
    }
    const buffer = await fs.readFile(req.file.path);
    const fields = await tenants.parseContractFromMedia(
      buffer.toString('base64'),
      req.file.mimetype,
    );
    res.json({ fields });
  } catch (e) {
    next(e);
  }
}

/** GET /api/buildings/:id/tenants — 건물의 임차인 목록 */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    res.json(await tenants.listTenants(ownerId, req.params.id));
  } catch (e) {
    next(e);
  }
}

/** POST /api/buildings/:id/tenants — 임차인 등록 */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    const tenant = await tenants.createTenant(
      ownerId,
      req.params.id,
      req.body ?? {},
    );
    res.status(201).json(tenant);
  } catch (e) {
    next(e);
  }
}

/** DELETE /api/buildings/:id/tenants/:tenantId — 임차인 삭제 */
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    await tenants.deleteTenant(ownerId, req.params.id, req.params.tenantId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

/** PATCH /api/buildings/:id/tenants/:tenantId/rent — L-04 월세 납부월 설정 */
export async function setRent(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    const lastPaidMonth = (req.body?.lastPaidMonth ?? null) as string | null;
    const tenant = await tenants.setLastPaidMonth(
      ownerId,
      req.params.id,
      req.params.tenantId,
      lastPaidMonth,
    );
    res.json(tenant);
  } catch (e) {
    next(e);
  }
}
