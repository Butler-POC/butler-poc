// Created: 2026-05-31
import fs from 'fs/promises';
import { NextFunction, Request, Response } from 'express';
import * as leases from '../services/leases.service';
import { AuthedRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';

/**
 * POST /api/leases/parse — 임대차계약서 업로드 → 비전 구조화 추출 (저장 X, T-01)
 */
export async function parse(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new HttpError(400, '업로드된 파일이 없습니다. (form-data field: "file")');
    }
    const buffer = await fs.readFile(req.file.path);
    const fields = await leases.parseLeaseFromMedia(
      buffer.toString('base64'),
      req.file.mimetype,
    );
    res.json({ fields });
  } catch (e) {
    next(e);
  }
}

/** GET /api/leases — 내 임차 건물 목록 */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId!;
    res.json(await leases.listLeases(userId));
  } catch (e) {
    next(e);
  }
}

/** POST /api/leases — 임차 건물 등록 */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId!;
    const lease = await leases.createLease(userId, req.body ?? {});
    res.status(201).json(lease);
  } catch (e) {
    next(e);
  }
}

/** GET /api/leases/:id */
export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId!;
    res.json(await leases.getLease(userId, req.params.id));
  } catch (e) {
    next(e);
  }
}

/** PATCH /api/leases/:id/rent — 마지막 납부월 설정(납부 처리/취소) */
export async function setRent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId!;
    const lastPaidMonth = (req.body?.lastPaidMonth ?? null) as string | null;
    res.json(await leases.setLastPaidMonth(userId, req.params.id, lastPaidMonth));
  } catch (e) {
    next(e);
  }
}

/** DELETE /api/leases/:id */
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId!;
    await leases.deleteLease(userId, req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
