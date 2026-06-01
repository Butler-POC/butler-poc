// Created: 2026-05-30 10:10
import axios from 'axios';

/**
 * 백엔드 API 래퍼.
 * - 웹/PWA 개발: 기본값 '/api' → Vite 프록시(:3000)로 전달
 * - 네이티브 앱(Capacitor): 프록시가 없으므로 VITE_API_BASE 에 백엔드 절대주소를 지정
 *   (예: VITE_API_BASE=https://api.butler.example.com/api)
 */
const baseURL = import.meta.env.VITE_API_BASE ?? '/api';

/** 로그인 토큰 저장 키 (localStorage) */
export const TOKEN_KEY = 'butler_token';

export const api = axios.create({
  baseURL,
});

// 모든 요청에 인증 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
