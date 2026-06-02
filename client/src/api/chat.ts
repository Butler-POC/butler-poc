// 챗봇(C-02) API 래퍼 — POST /api/chat
// './client' axios 인스턴스(baseURL '/api') 의 named export api 사용
import { api as http } from './client';
import type { ChatMessage, ChatMode, ChatResponse } from '@/types';

export function postChat(payload: {
  mode?: ChatMode;
  message: string;
  history?: ChatMessage[];
}): Promise<ChatResponse> {
  return http.post<ChatResponse>('/chat', payload).then((r) => r.data);
}
