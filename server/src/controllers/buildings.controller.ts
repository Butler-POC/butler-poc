// Created: 2026-05-30 11:08
import fs from 'fs/promises';
import { NextFunction, Request, Response } from 'express';
import * as buildings from '../services/buildings.service';
import { AuthedRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';

/**
 * POST /api/buildings/parse — 등기사항증명서 업로드 → 비전 구조화 추출 (저장 X)
 * 말소선(밑줄) 판별을 위해 문서를 이미지로 직접 분석한다.
 */
export async function parse(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new HttpError(400, '업로드된 파일이 없습니다. (form-data field: "file")');
    }
    const buffer = await fs.readFile(req.file.path);
    const fields = await buildings.parseRegistryFromMedia(
      buffer.toString('base64'),
      req.file.mimetype,
    );
    res.json({ fields });
  } catch (e) {
    next(e);
  }
}

/** POST /api/buildings — 건물 등록 */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    const building = await buildings.createBuilding(ownerId, req.body ?? {});
    res.status(201).json(building);
  } catch (e) {
    next(e);
  }
}

/** GET /api/buildings — 내 건물 목록 */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    res.json(await buildings.listBuildings(ownerId));
  } catch (e) {
    next(e);
  }
}

/** GET /api/buildings/:id */
export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    res.json(await buildings.getBuilding(ownerId, req.params.id));
  } catch (e) {
    next(e);
  }
}

/** DELETE /api/buildings/:id */
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    await buildings.deleteBuilding(ownerId, req.params.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}

/**
 * POST /api/buildings/ledger/parse — 건축물대장 업로드 → 비전 구조화 추출 (저장 X, L-02)
 */
export async function parseLedger(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.file) {
      throw new HttpError(400, '업로드된 파일이 없습니다. (form-data field: "file")');
    }
    const buffer = await fs.readFile(req.file.path);
    const fields = await buildings.parseLedgerFromMedia(
      buffer.toString('base64'),
      req.file.mimetype,
    );
    res.json({ fields });
  } catch (e) {
    next(e);
  }
}

/** PUT /api/buildings/:id/ledger — 건축물대장 등록/수정 (L-02) */
export async function saveLedger(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    const ledger = await buildings.upsertLedger(
      ownerId,
      req.params.id,
      req.body ?? {},
    );
    res.json(ledger);
  } catch (e) {
    next(e);
  }
}
