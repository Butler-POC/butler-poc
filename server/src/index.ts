// Created: 2026-05-30 10:04
import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './app';
import { initChatSocket } from './sockets/chat.socket';

const PORT = Number(process.env.PORT) || 3000;

const app = createApp();
const httpServer = createServer(app);

// A-02 채팅 / T-03 하자 알림 실시간 소켓
initChatSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[butler-server] listening on http://localhost:${PORT}`);
});
