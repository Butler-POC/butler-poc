// Created: 2026-05-30 10:10
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 네이티브 앱 빌드 시 백엔드 절대주소 (미지정 시 '/api') */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>;
  export default component;
}
