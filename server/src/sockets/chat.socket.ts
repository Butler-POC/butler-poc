// 실시간 채팅/알림 소켓 (Socket.io)
//  - A-02 건물주 연결: 공실 룸(vacancy:{vacancyId}:agent:{agentId}) 기준 에이전트↔오너 메시지 릴레이
//  - T-03 하자 제보: emitToUser 로 임대인 개인 룸(user:{userId})에 'issue:reported' 푸시
// 메시지는 POC 범위로 비영속(메모리 릴레이)이다.
import type { Server as HttpServer } from 'http';
import { Server, type Socket } from 'socket.io';
import { verifyToken } from '../services/auth.service';
import { prisma } from '../lib/prisma';
import type { UserType } from '../types/user';

let io: Server | null = null;

interface SocketData {
  userId: string;
  userType: UserType;
}

// vacancy 룸(vacancy:{vacancyId}:agent:{agentId})에서 공실 소유 임대인 id 조회
async function ownerOfVacancyRoom(roomId: string): Promise<string | null> {
  const m = /^vacancy:([^:]+):agent:/.exec(roomId);
  if (!m) return null;
  const vacancy = await prisma.vacancy.findUnique({
    where: { id: m[1] },
    select: { building: { select: { ownerId: true } } },
  });
  return vacancy?.building?.ownerId ?? null;
}

export function initChatSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, { cors: { origin: '*' } });

  // 핸드셰이크 JWT 인증 → socket.data 에 사용자 부착
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('unauthorized'));
    try {
      const payload = verifyToken(token);
      (socket.data as SocketData).userId = payload.sub;
      (socket.data as SocketData).userType = payload.userType;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, userType } = socket.data as SocketData;
    socket.join(`user:${userId}`); // 개인 룸 — emitToUser 대상

    socket.on('room:join', ({ roomId }: { roomId: string }) => {
      if (roomId) socket.join(roomId);
    });

    socket.on('room:leave', ({ roomId }: { roomId: string }) => {
      if (roomId) socket.leave(roomId);
    });

    socket.on('chat:send', async ({ roomId, text }: { roomId: string; text: string }) => {
      const body = (text ?? '').trim();
      if (!roomId || !body) return;
      const message = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        roomId,
        senderId: userId,
        senderRole: userType,
        text: body,
        createdAt: new Date().toISOString(),
      };
      io?.to(roomId).emit('chat:message', message); // 보낸 사람 포함 룸 전체

      // 공실 문의(vacancy 룸): 룸에 아직 없는 임대인에게도 개인 룸으로 전달 → 수신함 스레드 생성
      try {
        const ownerId = await ownerOfVacancyRoom(roomId);
        if (ownerId && ownerId !== userId) {
          io?.to(`user:${ownerId}`).emit('chat:message', message);
        }
      } catch {
        /* 소유자 조회 실패는 무시(룸 릴레이는 이미 완료) */
      }
    });
  });

  return io;
}

// 특정 사용자에게 이벤트 푸시 (T-03 임대인 하자 알림 등)
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(`user:${userId}`).emit(event, payload);
}
