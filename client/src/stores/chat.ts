// 실시간 채팅/알림 스토어 (Socket.io) — A-02 건물주 연결 / T-03 하자 알림 수신
// ⚠️ C-02 LLM 챗봇은 stores/chatbot.ts (요청-응답). 본 스토어는 소켓 전용.
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { io, type Socket } from 'socket.io-client';
import { TOKEN_KEY } from '@/api/client';

export interface RoomMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderRole: string;
  text: string;
  createdAt: string;
}

// A-02 오너측 수신함(VacancyChats)용 대화 스레드 요약
export interface ChatThread {
  roomId: string;
  counterpartName: string;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

// 소켓 서버 주소: VITE_API_BASE 의 '/api' 를 떼면 서버 오리진. 없으면 dev 프록시 동일 오리진.
function socketOrigin(): string {
  const base = import.meta.env.VITE_API_BASE as string | undefined;
  if (!base) return '/';
  return base.replace(/\/api\/?$/, '') || '/';
}

export const useChatStore = defineStore('chat', () => {
  const messages = ref<RoomMessage[]>([]);
  const connected = ref(false);
  let socket: Socket | null = null;

  function ensure(): Socket {
    if (socket) return socket;
    const token = localStorage.getItem(TOKEN_KEY) ?? '';
    socket = io(socketOrigin(), { auth: { token }, autoConnect: true });
    socket.on('connect', () => (connected.value = true));
    socket.on('disconnect', () => (connected.value = false));
    socket.on('chat:message', (m: RoomMessage) => messages.value.push(m));
    return socket;
  }

  async function joinRoom(roomId: string) {
    ensure().emit('room:join', { roomId });
  }

  function leaveRoom(roomId: string) {
    socket?.emit('room:leave', { roomId });
  }

  async function send(roomId: string, text: string) {
    ensure().emit('chat:send', { roomId, text });
  }

  // 임의 이벤트 구독(T-03 'issue:reported' 등)
  function on(event: string, cb: (...args: unknown[]) => void) {
    ensure().on(event, cb);
  }

  function off(event: string, cb: (...args: unknown[]) => void) {
    socket?.off(event, cb);
  }

  // 수신 메시지에서 룸별 대화 스레드를 파생(서버 스레드 목록 API 없음 — POC)
  const threads = computed<ChatThread[]>(() => {
    const byRoom = new Map<string, ChatThread>();
    for (const m of messages.value) {
      byRoom.set(m.roomId, {
        roomId: m.roomId,
        counterpartName: '에이전트',
        lastMessage: m.text,
        lastAt: m.createdAt,
        unread: 0,
      });
    }
    return [...byRoom.values()];
  });

  // VacancyChats onMounted 훅 — 소켓 연결만 보장(스레드는 수신 시 파생)
  async function loadThreads() {
    ensure();
  }

  return { messages, threads, connected, joinRoom, leaveRoom, send, on, off, loadThreads };
});
