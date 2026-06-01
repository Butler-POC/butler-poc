// Created: 2026-05-30 10:05
import fs from 'fs/promises';
import pdfParse from 'pdf-parse';
import { HttpError } from '../middleware/error';
import { extractTextFromMedia, isVisionEnabled } from './llm.service';

/**
 * C-01 OCR 스캐너 핵심 로직.
 *
 * 파일 종류로 분기하는 하이브리드:
 *   PDF  → pdf-parse 로 텍스트 레이어 직접 추출 (무료·정확)
 *          텍스트가 비면(스캔 PDF) → LLM 비전 폴백
 *   이미지 → LLM 비전 OCR
 */

/** 디지털 PDF로 간주할 최소 추출 글자 수. 이보다 적으면 스캔본으로 본다. */
const MIN_PDF_TEXT_CHARS = 20;

const IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export type OcrSource = 'pdf-text' | 'vision';

export interface OcrResult {
  /** 추출된 텍스트 */
  text: string;
  /** 추출 경로: 'pdf-text'(직접 추출) | 'vision'(LLM) */
  source: OcrSource;
  /** 비전 사용 시 프로바이더 식별자, 직접 추출이면 null */
  provider: string | null;
  /** 추출 글자 수 */
  charCount: number;
}

export async function scanFile(
  filePath: string,
  mimeType: string,
): Promise<OcrResult> {
  const buffer = await fs.readFile(filePath);

  if (mimeType === 'application/pdf') {
    return scanPdf(buffer);
  }

  if (IMAGE_MIME.has(mimeType)) {
    const v = await extractTextFromMedia(buffer.toString('base64'), mimeType);
    return { text: v.text, source: 'vision', provider: v.provider, charCount: v.text.length };
  }

  throw new HttpError(415, `지원하지 않는 파일 형식입니다: ${mimeType}`);
}

async function scanPdf(buffer: Buffer): Promise<OcrResult> {
  // 1) 디지털 PDF: 텍스트 레이어 직접 추출
  let extracted = '';
  try {
    const parsed = await pdfParse(buffer);
    extracted = (parsed.text ?? '').trim();
  } catch {
    extracted = '';
  }

  if (extracted.length >= MIN_PDF_TEXT_CHARS) {
    return {
      text: extracted,
      source: 'pdf-text',
      provider: null,
      charCount: extracted.length,
    };
  }

  // 2) 스캔 PDF(텍스트 레이어 없음): LLM 비전 폴백 (PDF 원본 그대로 전송)
  const v = await extractTextFromMedia(buffer.toString('base64'), 'application/pdf');
  return { text: v.text, source: 'vision', provider: v.provider, charCount: v.text.length };
}

export { isVisionEnabled };
