// Created: 2026-05-30 10:10
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
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
      '/api': 'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
      // A-02 실시간 채팅: socket.io 웹소켓을 백엔드(:3000)로 프록시 (ws 업그레이드 포함)
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
});
