// Created: 2026-05-30 10:53
import { NextFunction, Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { AuthedRequest } from '../middleware/auth';
import { HttpError } from '../middleware/error';

/** POST /api/auth/signup */
export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.signup(req.body ?? {});
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login(req.body ?? {});
    res.json(result);
  } catch (e) {
    next(e);
  }
}

/** GET /api/auth/me — 현재 로그인 사용자 */
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as AuthedRequest).userId!;
    const user = await authService.getUserById(userId);
    if (!user) throw new HttpError(404, '사용자를 찾을 수 없습니다.');
    res.json({ user });
  } catch (e) {
    next(e);
  }
}
