// Created: 2026-05-30 10:04
import express from 'express';
import cors from 'cors';
import ocrRouter from './routes/ocr';
import authRouter from './routes/auth';
import buildingsRouter from './routes/buildings';
import leasesRouter from './routes/leases';
import { notFound, errorHandler } from './middleware/error';
import { UPLOAD_ROOT } from './lib/paths';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // 업로드된 원본 문서 정적 제공
  app.use('/uploads', express.static(UPLOAD_ROOT));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'butler-server' });
  });

  // 인증 (회원가입 / 로그인)
  app.use('/api/auth', authRouter);

  // C-01 OCR 스캐너 (로그인 필요)
  app.use('/api/ocr', ocrRouter);

  // L-01 내 건물 등록 (임대인 전용)
  app.use('/api/buildings', buildingsRouter);

  // T-01 임차 건물 등록 (임차인 전용)
  app.use('/api/leases', leasesRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
