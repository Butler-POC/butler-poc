<!-- Created: 2026-06-03 20:39 -->
# 임차인 메인화면(오늘의 전달사항) + 월세 납부 상태 — 작업 보고서

- 작성일: 2026-06-03
- 작업자: StabAn-NRH
- 범위: Butler Tenant — 메인화면 + Lease 납부 상태(임대인 양식과 통일)

---

## 1. 개요

임대인 메인화면과 동일한 양식으로, 임차인이 로그인 후 진입하는 메인화면(`TenantHome`)에 **오늘의 전달사항**을 제공한다. 헤드라인 + 우선순위 정렬 리스트 + 삭제(✕). 기능 접근은 좌측 드로어.

## 2. 전달사항 3종 · 우선순위

| 순위 | 종류 | 조건 | 표시 |
|---|---|---|---|
| 1 | 월세 연체 | 지난 달(들) 미납 | 연체 개월·**연체액**·**마지막 납부월** |
| 2 | 오늘 월세 납부일 | 오늘이 납부일 & 미납 | 월세·납부일 |
| 3 | 계약 만료 6~1개월 | 단계별 안내 | 남은 일수 + 단계 설명 |

- 3단계 세부:
  - **6~2개월(통지 기간)**: 묵시적 갱신을 원치 않고 퇴거하려면 만료 2개월 전까지 임대인에게 통지해야 한다는 안내.
  - **2~1개월(묵시적 갱신 임박)**: 별도 통지가 없으면 동일 조건으로 자동 갱신될 수 있다는 안내.
- 정렬: 우선순위 → 최초 충족일(먼저 등록된 사항 우선) → 건물이름.
- 삭제 규칙은 임대인과 동일(월세납부=해당 월만, 연체=당일만 숨김·다음날 재노출, 계약만료=영구).

## 3. 월세 납부 상태(설계 결정)

- 임차인 `Lease`에는 결제 상태가 없었고, 임대인 `Tenant`와도 연결되지 않아 연체/마지막 납부월을 계산할 데이터가 없었다.
- 합의에 따라 **`Lease.lastPaidMonth` 추가**(db push), 판정은 기존 `rentState()` 재사용.
- 임차인이 직접 기록: **임차 건물 화면(`LeasesView`)에 "납부 처리 / 납부 취소" 토글** + 연체 강조(임대인 임차인 카드와 동일 UX).

## 4. 서버

- `GET /api/tenant/digest`, `POST /api/tenant/digest/dismiss` 신설(`buildTenantDigest`). 삭제 기록은 임대인과 동일한 `DigestDismissal` 테이블을 사용자 id 기준으로 공용.
- `PATCH /api/leases/:id/rent` — 마지막 납부월 설정. `listLeases`/`getLease`가 `rentStatus` 동반.

## 5. 주요 파일

- `views/tenant/TenantHome.vue` (전달사항 화면으로 교체), `views/tenant/LeasesView.vue`(납부 토글·코드 제거)
- `server/services/digest.service.ts`(`buildTenantDigest`·`noticesForLease`), `server/services/leases.service.ts`
- `server/controllers/digest.controller.ts`·`leases.controller.ts`, `server/routes/tenantDigest.ts`·`leases.ts`
- `client/api/digest.ts`·`leases.ts`, `prisma/schema.prisma`(Lease.lastPaidMonth)

## 6. 검증

- 전달사항 계산 로직 단위 검증 **13/13 통과**(연체/오늘납부 경계, 만료 6~2/2~1개월 단계·경계, 1개월 미만/6개월 초과 제외 등).
- server·client 빌드 통과.
