// Created: 2026-05-30 10:53
import { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../services/auth.service';
import { HttpError } from './error';
import { UserType } from '../types/user';

/** 인증된 요청에 부착되는 사용자 정보 */
export interface AuthedRequest extends Request {
  userId?: string;
  userType?: UserType;
}

/** Authorization: Bearer <token> 검증 후 req.userId / req.userType 부착 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new HttpError(401, '로그인이 필요합니다.'));
  }
  try {
    const payload = verifyToken(header.slice(7));
    const r = req as AuthedRequest;
    r.userId = payload.sub;
    r.userType = payload.userType;
    next();
  } catch {
    next(new HttpError(401, '세션이 만료되었습니다. 다시 로그인해 주세요.'));
  }
}

/** 특정 역할만 허용 (예: requireRole('LANDLORD')) */
export function requireRole(...allowed: UserType[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const r = req as AuthedRequest;
    if (!r.userType) return next(new HttpError(401, '로그인이 필요합니다.'));
    if (!allowed.includes(r.userType)) {
      return next(new HttpError(403, '접근 권한이 없습니다.'));
    }
    next();
  };
}
