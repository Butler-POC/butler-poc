// 챗봇(C-02) 스토어 (Pinia) — LLM 요청-응답 대화 상태.
// ⚠️ A-02 실시간 소켓 채팅용 stores/chat.ts 와는 다른 시스템(이름 충돌 회피 위해 chatbot 으로 분리).
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ChatMessage, ChatMode } from '@/types';
import { postChat } from '@/api/chat';

export const useChatbotStore = defineStore('chatbot', () => {
  const messages = ref<ChatMessage[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const disclaimer = ref<string | null>(null);

  async function send(message: string, mode: ChatMode = 'general') {
    const text = message.trim();
    if (!text || loading.value) return;
    error.value = null;
    messages.value.push({ role: 'user', content: text });
    loading.value = true;
    try {
      const res = await postChat({ mode, message: text, history: messages.value.slice(0, -1) });
      messages.value.push({ role: 'assistant', content: res.reply });
      disclaimer.value = res.disclaimer ?? null;
    } catch {
      error.value = '답변을 받지 못했습니다. 다시 시도해 주세요.';
    } finally {
      loading.value = false;
    }
  }

  function reset() {
    messages.value = [];
    disclaimer.value = null;
    error.value = null;
  }

  return { messages, loading, error, disclaimer, send, reset };
});
