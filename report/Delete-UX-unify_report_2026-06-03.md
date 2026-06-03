<!-- Created: 2026-06-03 20:38 -->
# 삭제 UX 통일(확인 팝업 공용화) — 작업 보고서

- 작성일: 2026-06-03
- 작업자: StabAn-NRH
- 범위: 임대인·임차인 전반의 카드 삭제 동작

---

## 1. 배경

여러 화면에서 카드 우상단 ✕로 즉시 삭제되어 모바일 오터치 사고 위험이 있었다. 건물 상세 페이지에서 도입한 "하단 버튼 + 재확인 팝업" 형식을 **표준으로 삼아 전 카드에 통일**했다.

## 2. 변경 내용

### 2-1. 공용 확인 팝업 컴포넌트
- `components/ui/ConfirmDialog.vue` 신설 — 제목 + 경고(슬롯) + 취소/삭제 버튼, 처리 중 비활성화, 배경 클릭 취소. 건물 상세 팝업과 동일한 양식.

### 2-2. 적용 화면(✕ 제거 → 하단 삭제 버튼 + 팝업)
| 화면 | 삭제 대상 | 경고 요지 |
|---|---|---|
| 임차인 관리(`BuildingTenantsView`) | 임차인 | 계약·월세 납부 정보 등 함께 삭제 |
| 공실 등록(`BuildingVacanciesView`) | 공실 매물 | "마감/다시 모집" 옆 삭제 버튼, 매물 정보 삭제 |
| 임차 건물(`LeasesView`, 임차인) | 임차 계약 | 계약·월세 정보 등 함께 삭제 |
| 건물 상세(`BuildingDetailView`) | 건물 | 임차인·공실 등 모든 관련 정보 삭제 |

- 공실은 요청에 따라 ✕ 대신 **토글 버튼 옆 "삭제" 버튼**으로 배치, 나머지는 카드 하단 풀폭 버튼.

## 3. 주요 파일

- `components/ui/ConfirmDialog.vue` (신설)
- `views/landlord/BuildingTenantsView.vue`, `views/landlord/BuildingVacanciesView.vue`
- `views/tenant/LeasesView.vue`, `views/landlord/BuildingDetailView.vue`

## 4. 비고

- 모든 삭제는 "소유 검증 → 삭제" 흐름 유지. 서버 동작 변경 없음(UX·재확인 계층만 추가).
