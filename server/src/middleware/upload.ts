// Created: 2026-05-30 10:04
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request } from 'express';
import { HttpError } from './error';
import { UPLOAD_ROOT } from '../lib/paths';

/** OCR 원본을 분류 저장할 카테고리 (CLAUDE.md uploads/ 구조) */
const CATEGORIES = ['registry', 'contracts', 'buildings', 'misc'] as const;
type Category = (typeof CATEGORIES)[number];

/** OCR이 처리할 수 있는 MIME 타입 */
const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function resolveCategory(req: Request): Category {
  const raw = (req.body?.category ?? req.query?.category ?? 'misc') as string;
  return (CATEGORIES as readonly string[]).includes(raw)
    ? (raw as Category)
    : 'misc';
}

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const dir = path.join(UPLOAD_ROOT, resolveCategory(req));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^\w가-힣.-]/g, '_')
      .slice(0, 40);
    const stamp = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${stamp}-${base}${ext}`);
  },
});

/** 단일 파일(field: "file") 업로드 미들웨어 */
export const uploadOcr = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new HttpError(415, `지원하지 않는 파일 형식입니다: ${file.mimetype}`) as any, false);
    }
  },
}).single('file');
