// 챗봇(C-02) 메시지 타입 — LLM 요청-응답 채팅.
// ⚠️ client/src/types 와 server/src/types 동일 유지.
// (A-02 실시간 소켓 채팅과는 별개 시스템: 이건 LLM 챗봇용)

export type ChatRole = 'user' | 'assistant';

export type ChatMode = 'general' | 'legal' | 'repair'; // 프롬프트 분기 모드

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

// POST /api/chat 요청
export interface ChatRequest {
  mode?: ChatMode; // 미지정 시 general
  message: string;
  history?: ChatMessage[];
}

// POST /api/chat 응답 (모드별로 disclaimer/추가필드가 더 붙을 수 있음)
export interface ChatResponse {
  reply: string;
  disclaimer?: string; // 법률·하자 모드에서 "참고용 · 법적 효력 없음"
}
