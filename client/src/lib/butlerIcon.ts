// 역할 → 집사 아이콘 매핑 (디자인 완료된 PNG 연결만; 새로 그리지 않음)
// 에셋: client/public/icons/ (각 1024² 투명 PNG)
//   - 등록 전(비로그인/역할 없음) = butler.png (고정)
//   - 임대인 = butler-landlord.png / 임차인 = butler-tenant.png / 중개사 = butler-agent.png
import type { UserType } from '@/types/user';

const ICONS = {
  default: '/icons/butler.png',
  LANDLORD: '/icons/butler-landlord.png',
  TENANT: '/icons/butler-tenant.png',
  AGENT: '/icons/butler-agent.png',
} as const;

/** 로그인 사용자의 역할에 맞는 아이콘 경로. 역할이 없으면 기본(butler.png). */
export function butlerIcon(role?: UserType | null): string {
  return role ? ICONS[role] : ICONS.default;
}

/** 스토어/파비콘/manifest 등 "고정" 표기에 쓰는 기본 아이콘. */
export const BUTLER_ICON_DEFAULT = ICONS.default;
