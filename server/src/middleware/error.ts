// Created: 2026-05-30 10:04
import { Request, Response, NextFunction } from 'express';

/** HTTP 상태 코드를 동반하는 애플리케이션 오류 */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: '요청한 리소스를 찾을 수 없습니다.' });
}

// Express 오류 핸들러는 인자 4개 시그니처를 유지해야 한다.
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  let status: number = err?.status ?? 500;
  let message: string = err?.message ?? '서버 오류가 발생했습니다.';

  // multer 파일 크기 초과
  if (err?.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    message = '파일이 너무 큽니다. (최대 20MB)';
  }

  if (status >= 500) {
    console.error('[error]', err);
  }

  res.status(status).json({ error: message });
}
