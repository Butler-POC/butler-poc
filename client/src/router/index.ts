// Created: 2026-05-30 10:58
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { APP_META, type UserType } from '@/types/user';

import LoginView from '@/views/auth/LoginView.vue';
import SignupView from '@/views/auth/SignupView.vue';
import LandlordHome from '@/views/landlord/LandlordHome.vue';
import BuildingsView from '@/views/landlord/BuildingsView.vue';
import BuildingRegisterView from '@/views/landlord/BuildingRegisterView.vue';
import BuildingLedgerView from '@/views/landlord/BuildingLedgerView.vue';
import BuildingTenantsView from '@/views/landlord/BuildingTenantsView.vue';
import BuildingVacanciesView from '@/views/landlord/BuildingVacanciesView.vue';
import TenantHome from '@/views/tenant/TenantHome.vue';
import LeasesView from '@/views/tenant/LeasesView.vue';
import AgentHome from '@/views/agent/AgentHome.vue';
import ScanView from '@/views/ScanView.vue';
// ── jh 슬라이스 화면(머지 시 추가) ──
import VendorSearch from '@/views/landlord/VendorSearch.vue'; // L-05
import LegalChat from '@/views/landlord/LegalChat.vue'; // L-06
import IssueInbox from '@/views/landlord/IssueInbox.vue'; // T-03 수신함
import VacancyChats from '@/views/landlord/VacancyChats.vue'; // A-02 오너측
import DefectChat from '@/views/tenant/DefectChat.vue'; // T-02
import DefectReport from '@/views/tenant/DefectReport.vue'; // T-03
import DefectHistory from '@/views/tenant/DefectHistory.vue'; // T-03 이력
import VacancyList from '@/views/agent/VacancyList.vue'; // A-01
import OwnerChat from '@/views/agent/OwnerChat.vue'; // A-02 에이전트측

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
    { path: '/signup', name: 'signup', component: SignupView, meta: { guestOnly: true } },

    // 역할별 앱 홈 — 자신의 유형만 접근 가능
    { path: '/app/landlord', name: 'landlord', component: LandlordHome, meta: { requiresAuth: true, role: 'LANDLORD' } },
    { path: '/app/landlord/buildings', name: 'landlord-buildings', component: BuildingsView, meta: { requiresAuth: true, role: 'LANDLORD' } },
    { path: '/app/landlord/buildings/new', name: 'landlord-building-new', component: BuildingRegisterView, meta: { requiresAuth: true, role: 'LANDLORD' } },
    { path: '/app/landlord/buildings/:id/ledger', name: 'landlord-building-ledger', component: BuildingLedgerView, meta: { requiresAuth: true, role: 'LANDLORD' } },
    { path: '/app/landlord/buildings/:id/tenants', name: 'landlord-building-tenants', component: BuildingTenantsView, meta: { requiresAuth: true, role: 'LANDLORD' } },
    { path: '/app/landlord/buildings/:id/vacancies', name: 'landlord-building-vacancies', component: BuildingVacanciesView, meta: { requiresAuth: true, role: 'LANDLORD' } },
    // L-05 수선 업체 / L-06 법률 상담 / T-03 하자 수신함 / A-02 공실 문의(오너측)
    { path: '/app/landlord/vendors', name: 'landlord-vendors', component: VendorSearch, meta: { requiresAuth: true, role: 'LANDLORD' } },
    { path: '/app/landlord/legal', name: 'landlord-legal', component: LegalChat, meta: { requiresAuth: true, role: 'LANDLORD' } },
    { path: '/app/landlord/issues', name: 'landlord-issues', component: IssueInbox, meta: { requiresAuth: true, role: 'LANDLORD' } },
    { path: '/app/landlord/vacancy-chats', name: 'landlord-vacancy-chats', component: VacancyChats, meta: { requiresAuth: true, role: 'LANDLORD' } },

    { path: '/app/tenant', name: 'tenant', component: TenantHome, meta: { requiresAuth: true, role: 'TENANT' } },
    { path: '/app/tenant/leases', name: 'tenant-leases', component: LeasesView, meta: { requiresAuth: true, role: 'TENANT' } },
    // T-02 하자 상담 / T-03 하자 제보·이력
    { path: '/app/tenant/defects', name: 'tenant-defect-history', component: DefectHistory, meta: { requiresAuth: true, role: 'TENANT' } },
    { path: '/app/tenant/defects/chat', name: 'tenant-defect-chat', component: DefectChat, meta: { requiresAuth: true, role: 'TENANT' } },
    { path: '/app/tenant/defects/report', name: 'tenant-defect-report', component: DefectReport, meta: { requiresAuth: true, role: 'TENANT' } },

    { path: '/app/agent', name: 'agent', component: AgentHome, meta: { requiresAuth: true, role: 'AGENT' } },
    // A-01 공실 조회 / A-02 건물주 연결(에이전트측)
    { path: '/app/agent/vacancies', name: 'agent-vacancies', component: VacancyList, meta: { requiresAuth: true, role: 'AGENT' } },
    { path: '/app/agent/vacancies/:vacancyId/chat', name: 'agent-owner-chat', component: OwnerChat, meta: { requiresAuth: true, role: 'AGENT' } },

    // 공통 기능 (로그인한 모든 역할)
    { path: '/scan', name: 'scan', component: ScanView, meta: { requiresAuth: true } },

    { path: '/', redirect: '/login' },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  const home = auth.userType ? APP_META[auth.userType].home : '/login';
  const role = to.meta.role as UserType | undefined;

  // 인증 필요한데 미로그인 → 로그인으로
  if (to.meta.requiresAuth && !auth.isAuthed) return { path: '/login' };

  // 이미 로그인했는데 로그인/가입 화면 → 자기 앱 홈으로
  if (to.meta.guestOnly && auth.isAuthed) return { path: home };

  // 다른 역할의 앱 접근 시도 → 자기 앱 홈으로 차단
  if (role && auth.userType && role !== auth.userType) return { path: home };

  return true;
});

export default router;
