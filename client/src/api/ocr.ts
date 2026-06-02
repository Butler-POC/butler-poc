// Created: 2026-05-30 10:11
import { api } from '@/api/client';

/** OCR 저장 카테고리 (server uploads/ 구조와 일치) */
export type OcrCategory = 'registry' | 'contracts' | 'buildings' | 'misc';

export interface OcrResponse {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storedPath: string;
  /** 추출된 텍스트 */
  text: string;
  /** 추출 경로: 'pdf-text'(직접 추출) | 'vision'(LLM) */
  source: 'pdf-text' | 'vision';
  provider: string | null;
  charCount: number;
}

/**
 * C-01 — 문서(PDF·이미지)를 업로드해 텍스트를 추출한다.
 * category는 쿼리 파라미터로 전달한다 (multer가 파일 이전 필드만 인식하므로).
 */
export async function scanDocument(
  file: File,
  category: OcrCategory = 'misc',
): Promise<OcrResponse> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<OcrResponse>('/ocr/scan', form, {
    params: { category },
  });
  return data;
}

export async function ocrHealth(): Promise<{ ok: boolean; visionEnabled: boolean }> {
  const { data } = await api.get('/ocr/health');
  return data;
}
