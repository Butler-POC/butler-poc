// Created: 2026-05-30 10:57
export type UserType = 'LANDLORD' | 'TENANT' | 'AGENT';

export interface User {
  id: string;
  email: string;
  name: string;
  userType: UserType;
}

/** 유형 → 앱 이름 · 역할 라벨 · 홈 경로 매핑 */
export const APP_META: Record<UserType, { app: string; label: string; home: string }> = {
  LANDLORD: { app: 'Butler Landlord', label: '임대인', home: '/app/landlord' },
  TENANT: { app: 'Butler Tenant', label: '임차인', home: '/app/tenant' },
  AGENT: { app: 'Butler Agent', label: '중개업자', home: '/app/agent' },
};
