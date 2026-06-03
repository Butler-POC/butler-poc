<!-- Created: 2026-06-03 20:39 -->
# 공실 등록 독립 페이지화(건물 종속 제거) — 작업 보고서

- 작성일: 2026-06-03
- 작업자: StabAn-NRH
- 범위: Butler Landlord — L-07 공실 등록 진입 구조 개선

---

## 1. 배경

기존 공실 등록은 "내 건물 → 특정 건물 → 공실" 처럼 **건물에 종속**돼 있었다. 드로어에서 바로 진입해 건물을 골라 등록하는 흐름으로 바꿨다.

## 2. 변경 내용

- 라우트를 건물 종속(`/buildings/:id/vacancies`) → **단독(`/app/landlord/vacancies`)** 으로 변경.
- 드로어 "공실 등록"을 누르면 바로 공실 등록 페이지로 이동. 페이지 상단 **드롭다운으로 내 건물을 선택**하면 그 건물의 기존 공실 목록·등록 폼이 표시된다. (건물이 1개면 자동 선택, `?buildingId=`로 사전 선택 가능)
- 건물 카드의 건물별 공실 링크 제거(종속 해제).
- 메인화면 전달사항의 "공실로 등록" 버튼도 신규 경로로 연결(건물·동호 사전 선택). 건물 미등록 시 안내 + 새 건물 등록 링크.

## 3. 주요 파일

- `views/landlord/BuildingVacanciesView.vue` — 건물 선택형 단독 페이지로 재작성
- `router/index.ts` — `landlord-vacancies` 라우트
- `lib/roleFeatures.ts` — 드로어 "공실 등록" 링크 변경
- `views/landlord/LandlordHome.vue` — "공실로 등록" 라우팅 갱신
- `components/domain/BuildingCard.vue` — 공실 링크 제거

## 4. 비고

- 서버 공실 API(`/buildings/:id/vacancies`)는 그대로 사용(buildingId를 화면 선택값으로 전달).
- 동/호 매칭(공실↔세입자)은 문자열 정규화 비교라, 표기 편차가 크면 어긋날 수 있음(향후 세대 식별자 정규화 고려).
