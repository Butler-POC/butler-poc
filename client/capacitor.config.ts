// Created: 2026-05-30 10:34
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.butler.app',
  appName: 'Butler',
  // Vite 빌드 산출물 디렉토리 (npm run build → dist)
  webDir: 'dist',
  // 개발용: http 백엔드(VITE_API_BASE) 호출 허용. 웹뷰 origin 도 http 로 맞춰 mixed-content 회피.
  // 운영 배포(https 백엔드) 시에는 이 server 블록을 제거한다.
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
};

export default config;
