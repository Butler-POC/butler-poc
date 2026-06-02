// Created: 2026-05-31
import { NextFunction, Request, Response } from 'express';
import * as vacancies from '../services/vacancies.service';
import { AuthedRequest } from '../middleware/auth';

/** GET /api/buildings/:id/vacancies — 건물의 공실 목록 */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    res.json(await vacancies.listVacancies(ownerId, req.params.id));
  } catch (e) {
    next(e);
  }
}

/** POST /api/buildings/:id/vacancies — 공실 등록 */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    const vacancy = await vacancies.createVacancy(
      ownerId,
      req.params.id,
      req.body ?? {},
    );
    res.status(201).json(vacancy);
  } catch (e) {
    next(e);
  }
}

/** PATCH /api/buildings/:id/vacancies/:vacancyId — 공실 수정(상태 토글 등) */
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    const vacancy = await vacancies.updateVacancy(
      ownerId,
      req.params.id,
      req.params.vacancyId,
      req.body ?? {},
    );
    res.json(vacancy);
  } catch (e) {
    next(e);
  }
}

/** DELETE /api/buildings/:id/vacancies/:vacancyId — 공실 삭제 */
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const ownerId = (req as AuthedRequest).userId!;
    await vacancies.deleteVacancy(ownerId, req.params.id, req.params.vacancyId);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
}
