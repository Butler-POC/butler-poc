<!-- Created: 2026-06-03 20:39 -->
# 월세 연체자 종합 조회 — 작업 보고서

- 작성일: 2026-06-03
- 작업자: StabAn-NRH
- 범위: Butler Landlord — 전 건물 연체자 종합 화면(L-04 연계)

---

## 1. 배경

기존 L-04는 건물별 임차인 카드에서 연체를 강조 표시했다. 임대인이 **전체 건물에 걸친 연체자를 한 곳에서** 보도록 종합 조회 화면을 추가했다.

## 2. 변경 내용

- 드로어 "월세 연체 표시" → **"현재 월세 연체자"** 로 라벨 변경, 종합 조회 페이지(`/app/landlord/overdue`)로 이동.
- 전 건물에서 **현재 월세를 납부하지 않은(OVERDUE) 임차인을 카드로** 표시.
  - 카드 정보: 이름·동호·건물, 월세, **연체액(월세 × 연체개월)**, 최종납부월, 연체개월 배지.
  - 정렬: 연체 개월수 많은 순 → 이름순.
- **카드를 누르면 해당 건물의 임차인 관리 페이지**로 이동.
- 연체자가 없으면 안내 문구.

## 3. 서버

- `GET /api/landlord/overdue-tenants` 신설 — `listOverdueTenants(ownerId)`: 소유 건물의 전 임차인을 조회해 기존 `rentState()`로 OVERDUE만 필터, 건물 정보 동반 반환.

## 4. 주요 파일

- `views/landlord/OverdueTenantsView.vue` (신설)
- `server/services/tenants.service.ts` — `listOverdueTenants`
- `server/controllers/digest.controller.ts`, `server/routes/digest.ts` — 라우트
- `client/api/digest.ts` — `getOverdueTenants`
- `lib/roleFeatures.ts`, `router/index.ts`

## 5. 비고

- 연체 판정은 L-04와 동일한 `rentState()`(monthlyRent·paymentDay·lastPaidMonth 기반)를 재사용해 일관성 확보.
