// Created: 2026-06-03
// 역할별 기능 목록 — 홈 화면과 좌측 드로어(NavDrawer)가 공유한다.
import type { UserType } from '@/types/user';

export interface Feature {
  code: string;
  name: string;
  to?: string;
}

/** 모든 앱 공통 기능 (C-) */
export const COMMON_FEATURES: Feature[] = [
  { code: 'C-01', name: '문서 텍스트 추출', to: '/scan' },
  { code: 'C-02', name: '챗봇 상담', to: '/chat' },
];

/** 역할별 기능 */
export const ROLE_FEATURES: Record<UserType, Feature[]> = {
  LANDLORD: [
    { code: 'L-01', name: '내 건물', to: '/app/landlord/buildings' },
    { code: 'L-03', name: '임차인 등록', to: '/app/landlord/buildings' },
    { code: 'L-04', name: '현재 월세 연체자', to: '/app/landlord/overdue' },
    { code: 'L-05', name: '수선 업체 조회', to: '/app/landlord/vendors' },
    { code: 'L-06', name: '간단 법률 상담', to: '/app/landlord/legal' },
    { code: 'L-07', name: '공실 등록', to: '/app/landlord/vacancies' },
    { code: 'L·하자', name: '하자 수신함', to: '/app/landlord/issues' },
    { code: 'L·문의', name: '공실 문의함', to: '/app/landlord/vacancy-chats' },
  ],
  TENANT: [
    { code: 'T-01', name: '임차 건물', to: '/app/tenant/leases' },
    { code: 'T-02', name: '하자 상담', to: '/app/tenant/defects/chat' },
    { code: 'T-03', name: '하자 제보', to: '/app/tenant/defects/report' },
    { code: 'T-03', name: '제보 이력', to: '/app/tenant/defects' },
  ],
  AGENT: [
    { code: 'A-01', name: '공실 조회', to: '/app/agent' },
    { code: 'A-02', name: '건물주 연결', to: '/app/agent/chats' },
  ],
};
