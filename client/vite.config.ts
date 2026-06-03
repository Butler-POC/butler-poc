// Created: 2026-05-30 10:10
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(() => {
  // 백엔드 주소는 .env.production 의 VITE_API_BASE 한 곳에서만 관리한다.
  // 개발 프록시(npm run dev)도 같은 값을 쓰도록 production env 를 읽어
  // origin(스킴+호스트+포트)만 뽑아 타깃으로 사용한다.
  const env = loadEnv('production', process.cwd(), '');
  const apiBase = env.VITE_API_BASE ?? 'http://localhost:3000/api';
  const backend = apiBase.replace(/\/api\/?$/, ''); // 예: http://...amazonaws.com:3000

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: 'localhost', // Kakao 지도 JS 키 도메인(localhost:5173)과 일치시키기 위해 고정. 127.0.0.1 접속 금지.
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': backend,
        '/uploads': backend,
        // A-02 실시간 채팅: socket.io 웹소켓을 백엔드(:3000)로 프록시 (ws 업그레이드 포함)
        '/socket.io': { target: backend, ws: true },
      },
    },
  };
});
