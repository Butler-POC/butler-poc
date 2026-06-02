// Created: 2026-05-30 10:05
import path from 'path';
import { Request, Response, NextFunction } from 'express';
import { scanFile, isVisionEnabled } from '../services/ocr.service';
import { HttpError } from '../middleware/error';
import { UPLOAD_ROOT } from '../lib/paths';

/** POST /api/ocr/scan — 업로드된 문서에서 텍스트 추출 */
export async function scan(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new HttpError(400, '업로드된 파일이 없습니다. (form-data field: "file")');
    }

    const result = await scanFile(req.file.path, req.file.mimetype);

    const relative = path.relative(UPLOAD_ROOT, req.file.path).split(path.sep).join('/');

    res.json({
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      storedPath: `/uploads/${relative}`,
      ...result,
    });
  } catch (e) {
    next(e);
  }
}

/** GET /api/ocr/health — 비전 활성 여부 확인 */
export function health(_req: Request, res: Response) {
  res.json({ ok: true, visionEnabled: isVisionEnabled() });
}
