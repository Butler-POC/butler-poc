// Created: 2026-05-30 10:05
import { HttpError } from '../middleware/error';

/**
 * LLM 서비스 — Claude(Anthropic) 어댑터.
 * C-01 OCR 비전 추출과 C-02 챗봇이 공용으로 사용한다.
 * 키(API_KEY)가 없으면 비전 기능은 비활성( isVisionEnabled() === false ).
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const DEFAULT_MODEL = 'claude-sonnet-4-6';

/** Claude 비전 API 이미지 base64 최대 크기 (10 MiB). 초과 시 400 → 사전 차단. */
const VISION_IMAGE_BASE64_LIMIT = 10 * 1024 * 1024;

const OCR_PROMPT = `당신은 정밀 OCR 엔진입니다. 첨부된 문서(한국 부동산 관련 서류일 수 있음)에 보이는 모든 텍스트를 빠짐없이 그대로 추출하세요.

규칙:
- 표는 행과 열 구조를 최대한 유지합니다.
- 해설, 요약, 추측을 덧붙이지 말고 문서에 실제로 있는 텍스트만 출력합니다.
- 판독할 수 없는 부분은 [판독불가]로 표기합니다.

출력에는 추출한 텍스트만 포함하세요.`;

function getApiKey(): string | undefined {
  // .env 에는 API_KEY 로 보관. (호환을 위해 ANTHROPIC_API_KEY 도 인정)
  return process.env.API_KEY || process.env.ANTHROPIC_API_KEY;
}

export function isVisionEnabled(): boolean {
  return Boolean(getApiKey());
}

export interface VisionExtractResult {
  text: string;
  provider: string;
}

/**
 * 이미지 또는 PDF(base64)를 Claude 비전에 보내 텍스트를 추출한다.
 * @param base64 파일의 base64 인코딩 (데이터 URI 접두사 없이)
 * @param mediaType MIME 타입 (image/* 또는 application/pdf)
 */
export async function extractTextFromMedia(
  base64: string,
  mediaType: string,
): Promise<VisionExtractResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new HttpError(
      503,
      'LLM 비전이 비활성화되어 있습니다. server/.env 의 API_KEY 를 설정하세요.',
    );
  }

  const model = process.env.LLM_MODEL || DEFAULT_MODEL;
  const isPdf = mediaType === 'application/pdf';

  if (!isPdf && base64.length > VISION_IMAGE_BASE64_LIMIT) {
    throw new HttpError(
      413,
      '이미지가 너무 큽니다. 약 7.5MB 이하의 이미지를 첨부해 주세요. (전송 시 base64 인코딩으로 용량이 약 1.33배 늘어 10MB 한도를 초과합니다.)',
    );
  }

  const mediaBlock = isPdf
    ? {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      }
    : {
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      };

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        messages: [
          { role: 'user', content: [mediaBlock, { type: 'text', text: OCR_PROMPT }] },
        ],
      }),
    });
  } catch (e: any) {
    throw new HttpError(502, `LLM 호출 중 네트워크 오류: ${e?.message ?? e}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new HttpError(
      502,
      `LLM 비전 호출 실패 (${res.status}). ${detail.slice(0, 300)}`,
    );
  }

  const data: any = await res.json();
  const text: string = (data.content ?? [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
    .trim();

  return { text, provider: `claude:${model}` };
}

/**
 * 텍스트(예: OCR 원문)에서 구조화 JSON을 추출한다 (Claude 텍스트 호출).
 * @param systemInstruction 추출 규칙 + 출력 스키마 안내
 * @param userText 분석할 원문
 */
export async function extractJSON<T = unknown>(
  systemInstruction: string,
  userText: string,
): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new HttpError(
      503,
      'LLM 기능이 비활성화되어 있습니다. server/.env 의 API_KEY 를 설정하세요.',
    );
  }
  const model = process.env.LLM_MODEL || DEFAULT_MODEL;

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system: systemInstruction,
        messages: [{ role: 'user', content: userText }],
      }),
    });
  } catch (e: any) {
    throw new HttpError(502, `LLM 호출 중 네트워크 오류: ${e?.message ?? e}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new HttpError(502, `LLM 호출 실패 (${res.status}). ${detail.slice(0, 300)}`);
  }

  const data: any = await res.json();
  const text: string = (data.content ?? [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
    .trim();

  return parseJsonLoose<T>(text);
}

/**
 * 이미지/PDF를 **비전으로 직접 분석**해 구조화 JSON을 추출한다.
 * OCR 텍스트가 아니라 문서 이미지를 보므로, 등기부 말소선(밑줄) 같은
 * 시각 정보를 판별할 수 있다.
 */
export async function extractJSONFromMedia<T = unknown>(
  systemInstruction: string,
  base64: string,
  mediaType: string,
): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new HttpError(
      503,
      'LLM 기능이 비활성화되어 있습니다. server/.env 의 API_KEY 를 설정하세요.',
    );
  }
  const model = process.env.LLM_MODEL || DEFAULT_MODEL;
  const isPdf = mediaType === 'application/pdf';
  if (!isPdf && base64.length > VISION_IMAGE_BASE64_LIMIT) {
    throw new HttpError(
      413,
      '이미지가 너무 큽니다. 약 7.5MB 이하의 이미지를 첨부해 주세요. (전송 시 base64 인코딩으로 용량이 약 1.33배 늘어 10MB 한도를 초과합니다.)',
    );
  }
  const mediaBlock = isPdf
    ? {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: base64 },
      }
    : {
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      };

  let res: Response;
  try {
    res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system: systemInstruction,
        messages: [
          {
            role: 'user',
            content: [
              mediaBlock,
              { type: 'text', text: '문서를 분석해 지정된 JSON 객체만 출력하세요.' },
            ],
          },
        ],
      }),
    });
  } catch (e: any) {
    throw new HttpError(502, `LLM 호출 중 네트워크 오류: ${e?.message ?? e}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new HttpError(502, `LLM 호출 실패 (${res.status}). ${detail.slice(0, 300)}`);
  }

  const data: any = await res.json();
  const text: string = (data.content ?? [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('\n')
    .trim();

  return parseJsonLoose<T>(text);
}

/** LLM 응답에서 JSON 본문만 안전하게 파싱 (코드펜스/잡텍스트 제거) */
function parseJsonLoose<T>(text: string): T {
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1) s = s.slice(first, last + 1);
  try {
    return JSON.parse(s) as T;
  } catch {
    throw new HttpError(502, 'LLM 응답을 구조화하지 못했습니다.');
  }
}
