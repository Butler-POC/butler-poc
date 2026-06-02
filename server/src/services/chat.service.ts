// C-02 챗봇 — 외부 LLM 단일 호출기 (Claude / Anthropic SDK)
// 모든 대화형 AI(법률 L-06 · 하자/수선비율 T-02·T-03 · 일반 챗봇)는 이 chat() 하나로 호출하고 프롬프트로 분기한다.
//
// ※ 머지 정리: 기반(jg)의 llm.service 는 C-01 OCR 비전 추출(extractTextFromMedia/extractJSON…) 전용이라,
//    챗봇 게이트웨이는 충돌을 피해 본 파일로 분리한다. (둘 다 Claude/Anthropic 사용)
// 의존성: @anthropic-ai/sdk (server/package.json 에 추가됨)
import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';

const MODEL = 'claude-opus-4-8';

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: env.anthropicApiKey });
  return _client;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatParams {
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
}

// 단일 LLM 호출 → 응답 텍스트 반환.
// 채팅 UI 용 요청-응답이라 적당한 max_tokens 로 비스트리밍 호출(타임아웃 한계 내).
// 프롬프트 캐싱: system 블록에 cache_control 부여(프롬프트가 캐시 최소 토큰을 넘으면 자동 적용).
export async function chat({ system, messages, maxTokens = 4096 }: ChatParams): Promise<string> {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}
