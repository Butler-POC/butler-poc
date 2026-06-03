<!-- Created: 2026-06-03 20:39 -->
# 중개업자 메인화면 = 공실 조회 — 작업 보고서

- 작성일: 2026-06-03
- 작업자: StabAn-NRH
- 범위: Butler Agent — 메인화면(A-01 공실 조회)

---

## 1. 개요

중개업자의 핵심 기능이 공실 조회이므로, 로그인 후 진입하는 메인화면(`AgentHome`)을 **공실 조회 화면**으로 만들었다(임대인·임차인 홈과 헤더 양식 통일).

## 2. 변경 내용

- `AgentHome`을 RoleHome(기능 목록) → **공실 조회 화면**으로 교체.
  - 임대인이 등록한 공실을 "빈 방 + 임대인 정보" 카드로 조회, "모집중만 보기" 필터.
  - 카드의 "임대인 연결" → A-02 채팅(`agent-owner-chat`) 진입(기존 동작 유지).
- 기존 별도 공실 조회 화면(`VacancyList.vue`, `/app/agent/vacancies`)은 메인화면과 **중복**이라 삭제·라우트 제거.
- 드로어 "공실 조회" 항목 → 메인화면(`/app/agent`)으로 연결. A-02 채팅 라우트는 유지.

## 3. 주요 파일

- `views/agent/AgentHome.vue` — 공실 조회 화면으로 작성(`useVacanciesStore` 재사용)
- `views/agent/VacancyList.vue` — 삭제
- `router/index.ts` — 중복 라우트 제거, OwnerChat 라우트 유지
- `lib/roleFeatures.ts` — A-01 링크 → `/app/agent`

## 4. 비고

- 이로써 임대인·임차인·중개업자 3개 역할이 모두 **메인화면 + 드로어** 양식으로 통일됐다.
