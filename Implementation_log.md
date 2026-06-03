<!-- Created: 2026-05-31 06:56 -->
# Implementation_log.md

> 버틀러 개발 작업일지. **Claude Code는 작업 시작 전 이 문서를 먼저 읽는다.**
>
> **읽는 법**: 아래 `📍 다음 작업`에서 착수할 기능을 확인한다.
> **갱신 법** (작업 완료 시 반드시):
> 1. 해당 기능 행의 **상태**를 `✅`로, **완료일시**·**작업자** 기입
> 2. 영역별·전체 **진행 현황** 카운트·진행률 갱신
> 3. `📍 다음 작업`을 다음 미완료 기능으로 변경
> 4. 맨 아래 **작업 로그**에 한 줄 추가
>
> 상태 표기: `⬜ 대기` · `🔨 진행 중` · `✅ 완료`

---

## 📍 다음 작업

**역할별 앱 UX 고도화 — 3개 역할 메인화면·드로어 통일 완료.** 14개 기능 구현·통합은 완료(아래 표).
- ✅ 좌측 기능 드로어(햄버거, 전 역할 공통) + 기능코드 비노출
- ✅ 임대인 메인화면(오늘의 전달사항) + 월세 연체자 종합 조회 + 건물 상세 페이지
- ✅ 임차인 메인화면(전달사항) + Lease 납부상태(납부 처리/취소)
- ✅ 중개업자 메인화면 = 공실 조회
- ✅ 삭제 UX 통일(카드 하단 버튼 + 확인 팝업 ConfirmDialog)
- ⬜ (선택) Android 패키징 실기 검증 — Capacitor 설정·빌드는 준비됨(에뮬레이터 10.0.2.2 기준)

---

## 진행 현황

| 영역 | 완료 | 남음 | 진행률 |
|---|---:|---:|---:|
| 공통 | 2 | 0 | 100% |
| 임대인 | 7 | 0 | 100% |
| 임차인 | 3 | 0 | 100% |
| 중개업자 | 2 | 0 | 100% |
| **전체** | **14** | **0** | **100%** |

---

## 인증 · 기반 (회원가입/로그인)

> 기능 코드 외 공통 인프라. OCR·역할 앱 사용의 전제.

| 항목 | 설명 | 상태 | 완료일시 | 작업자 |
|---|---|:---:|---|---|
| 회원가입 | 유형(임대인/임차인/중개업자) 선택 · bcrypt 해시 저장 | ✅ | 2026-05-30 | StabAn-NRH |
| 로그인 | JWT 발급 · 유형별 앱으로 라우팅 | ✅ | 2026-05-30 | StabAn-NRH |
| 역할 가드 | 타 역할 앱 접근 차단(라우터 가드 + 서버 requireAuth) | ✅ | 2026-05-30 | StabAn-NRH |

---

## 공통 기능

| 코드 | 기능명 | 설명 | 상태 | 완료일시 | 작업자 |
|---|---|---|:---:|---|---|
| C-01 | OCR 스캐너 | PDF·이미지에서 텍스트 추출 | ✅ | 2026-05-30 | StabAn-NRH |
| C-02 | 챗봇 | 외부 LLM API에 프롬프트 전송·응답 가공해 채팅 형식 제공 | ✅ | 2026-06-01 | jh |

## 임대인 기능

| 코드 | 기능명 | 설명 | 상태 | 완료일시 | 작업자 |
|---|---|---|:---:|---|---|
| L-01 | 내 건물 등록 | OCR·수동으로 등기부등본 정보 등록 | ✅ | 2026-05-30 | StabAn-NRH |
| L-02 | 내 건물 정보 등록 | OCR·수동으로 건축물대장 정보 등록 | ✅ | 2026-05-31 | StabAn-NRH |
| L-03 | 임차인 등록 | OCR·수동으로 임대차계약서 정보 등록 | ✅ | 2026-05-31 | StabAn-NRH |
| L-04 | 월세 연체 강조 표시 | 월세 연체 임차인 강조 표시 | ✅ | 2026-05-31 | StabAn-NRH |
| L-05 | 수선 업체 조회 | 건물 관리 관련 업체 조회 (Kakao) | ✅ | 2026-06-01 | jh |
| L-06 | 간단 법률 상담 | 건물·임차인 정보 기반 챗봇 법률 상담 | ✅ | 2026-06-01 | jh |
| L-07 | 공실 등록 | 세입자 구할 공실 등록 | ✅ | 2026-05-31 | StabAn-NRH |

## 임차인 기능

| 코드 | 기능명 | 설명 | 상태 | 완료일시 | 작업자 |
|---|---|---|:---:|---|---|
| T-01 | 임차 건물 등록 | OCR·수동으로 임대차계약서 정보 등록 | ✅ | 2026-05-31 | StabAn-NRH |
| T-02 | 하자 상담 | 건물·특약사항 기반 챗봇 하자 상담 | ✅ | 2026-06-01 | jh |
| T-03 | 하자 제보 | 하자 내용·제안 수선비율을 임대인에게 제보 | ✅ | 2026-06-01 | jh |

## 중개업자 기능

| 코드 | 기능명 | 설명 | 상태 | 완료일시 | 작업자 |
|---|---|---|:---:|---|---|
| A-01 | 공실 조회 | 소유권자가 등록한 공실 조회 | ✅ | 2026-06-01 | jh |
| A-02 | 건물주 연결 | 소유권자와 공실에 대해 채팅 | ✅ | 2026-06-01 | jh |

---

## 작업 로그

> 작업할 때마다 최신 항목을 맨 위에 추가. 형식: `YYYY-MM-DD · 코드 기능명 · 상태 · 작업자 · 메모`

- 2026-06-03 · Android(Capacitor) 빌드 설정 · ✅ · StabAn-NRH · 네이티브 실행 준비. `.env.production`(VITE_API_BASE=http://10.0.2.2:3000/api), capacitor.config server `{androidScheme:'http', cleartext:true}`. build+`cap sync android` 완료. Kakao 지도는 origin 불일치로 네이티브 제한(키 도메인 등록 필요).
- 2026-06-03 · 버그수정 · 임차 건물 삭제 시 하자 제보 잔존 · ✅ · StabAn-NRH · Issue는 Lease와 FK cascade 없이 leaseId 스칼라 연결 + 이력은 tenantId 조회라 Lease 삭제해도 남음. deleteLease에서 leaseId·tenantId 일치 Issue를 트랜잭션으로 함께 삭제.
- 2026-06-03 · 중개업자 메인화면 = 공실 조회 · ✅ · StabAn-NRH · AgentHome을 공실 조회(A-01)로 전환(모집중 필터·임대인 연결 A-02 진입). 중복된 VacancyList.vue/`/app/agent/vacancies` 라우트 제거, 드로어 A-01→/app/agent.
- 2026-06-03 · 임차인 메인화면(전달사항) + 월세 납부상태 · ✅ · StabAn-NRH · TenantHome 전달사항 3종(연체>오늘납부>계약만료 6~1개월 2단계: 통지기간/묵시갱신임박) 우선순위 정렬+삭제(임대인과 동일 규칙). Lease.lastPaidMonth 추가(db push), LeasesView 납부 처리/취소 토글, `/api/tenant/digest`. 계산로직 단위검증 13/13. 기능코드 제거.
- 2026-06-03 · 월세 연체자 종합 조회 · ✅ · StabAn-NRH · 드로어 "현재 월세 연체자"→ 전 건물 OVERDUE 임차인 카드 종합(연체개월·연체액·최종납부월), 카드→임차인 관리 진입. `/api/landlord/overdue-tenants`(listOverdueTenants).
- 2026-06-03 · 건물 상세 페이지 + 삭제 UX 통일 · ✅ · StabAn-NRH · BuildingDetailView 신설(건축물대장 정리 표시, 건축물대장 등록/수정·삭제 이동). 건물 카드 클릭→상세, ✕ 즉시삭제 제거. 공용 ConfirmDialog로 삭제 재확인 팝업 통일(건물·임차인·공실·임차건물 카드 하단 삭제 버튼).
- 2026-06-03 · 공실 등록 독립 페이지화 · ✅ · StabAn-NRH · 건물 종속 제거 → 드로어 "공실 등록"에서 단독 진입 후 건물 선택해 등록(BuildingVacanciesView 재작성, `/app/landlord/vacancies`). 건물 카드의 공실 링크 제거.
- 2026-06-03 · 임대인 화면 UX 정리 · ✅ · StabAn-NRH · 화면 기능코드 전면 제거, 드로어에서 공통기능(C-01·02) 네비게이션 숨김(구현 보존)·로그아웃은 드로어로 일원화·"임대인 기능" 타이틀 제거. 임차인 버튼 색/형태(구분선) 조정.
- 2026-06-03 · L-06 간단 법률 상담 (연체 맥락 수정) · ✅ · StabAn-NRH · 법률 상담 컨텍스트의 연체 주입 결함 수정. 기존 `t.overdue`(미존재 필드)로 항상 false → `rentState()` 계산값으로 교체(chat.controller buildOwnerLegalContext). legal.prompt에 overdueMonths 추가, "※ 월세 연체 N개월 상태" 표출. 프롬프트 무결성 검증 11/11 통과.
- 2026-06-03 · 임대인 메인화면(오늘의 전달사항) + 기능 드로어 · ✅ · StabAn-NRH · 좌상단 햄버거→좌측 드로어(기능 접근). 메인화면 헤드라인+전달사항 4종(월세납부일/만료임박/연체/공실미처리) 우선순위 정렬. 삭제 영속(연체는 당일한정), 묵시적갱신 플래그(Tenant.renewedImplicitly), 공실로 등록 연동. 신규: DigestDismissal 모델, /api/landlord/digest. 계산로직 단위검증 15/15.
- 2026-06-03 · 통합(머지) · ✅ · StabAn-NRH · 빌드 검증 완료. 신규 PC에서 의존성 미설치(@anthropic-ai/sdk·socket.io·socket.io-client)와 Issue 모델 추가 후 prisma client stale 확인 → server/client `npm install` + `prisma generate` 후 server(tsc)·client(vue-tsc+vite) 빌드 모두 통과. jg=main 동일.
- 2026-06-02 · 통합(머지) · 🔨 · jh · main에서 jg↔jh 머지. 충돌 4건 해결(schema=jg+Issue추가, llm.service=jg / chat()→chat.service 분리, vacancies.ts=jg, log 통합). 라우트·소켓·공실 모델 배선 + 빌드 검증 진행
- 2026-06-01 · C-02 챗봇 · ✅ · jh · llm.service(Anthropic SDK, claude-opus-4-8, API 실호출 확인) + routes/chat 디스패처 + IssueChat/api·chatbot 스토어. L-06/T-02/T-03 실배선
- 2026-06-01 · L-05 수선 업체 조회 · ✅ · jh · kakao.service 키워드검색(REST키 실동작 확인) + vendors 라우트 + useKakaoMap/VendorMap 지도
- 2026-06-01 · L-06 간단 법률 상담 · ✅ · jh · legal.prompt + 임대인 건물·임차인 맥락 자동주입(chat.controller), 디스클레이머 상시노출
- 2026-06-01 · T-02 하자 상담 · ✅ · jh · repairRate.prompt/service(수선비율 JSON 판정) + repairChat, 상담응답+분담비율+디스클레이머
- 2026-06-01 · T-03 하자 제보 · ✅ · jh · Issue 저장 + 분담비율 기반 임대인 연락 판정(소켓 emitToUser), 제보폼·수신함·이력
- 2026-06-01 · A-01 공실 조회 · ✅ · jh · 임대인 정보 동반 공실 목록·필터, 카드→A-02 진입
- 2026-06-01 · A-02 건물주 연결 · ✅ · jh · 공실 기준 에이전트↔오너 실시간 채팅(공용 VacancyChat)
- 2026-05-31 · L-04 월세 연체 강조 표시 · ✅ · StabAn-NRH · Tenant lastPaidMonth + rentState() 판정(PAID/OVERDUE/UNKNOWN/NO_RENT). 임차인 카드 강조 + 납부 처리/취소, 건물 카드 "연체 N" 배지. report L-04.
- 2026-05-31 · T-01 임차 건물 등록 · ✅ · StabAn-NRH · 임차인 전용 Lease 모델(userId 1:N). 비전 추출(parseLease) + 수동. `/api/leases`. 특약은 T-02 대비. report T-01.
- 2026-05-31 · L-07 공실 등록 · ✅ · StabAn-NRH · LLM 없이 CRUD. Vacancy 모델(거래유형·보증금/월세·면적·층·상태 OPEN/CLOSED). `/buildings/:id/vacancies`. status 인덱스로 A-01 대비. report L-07.
- 2026-05-31 · 이미지 업로드 크기 안내 · ✅ · StabAn-NRH · base64(×4/3)로 10MB 초과 문제. 클라·서버 사전 차단 + 안내.
- 2026-05-31 · L-03 임차인 등록 · ✅ · StabAn-NRH · 건물(L-01)에 1:N. parseContract 재사용 + 수동. Tenant 모델, `/buildings/:id/tenants`. report L-03.
- 2026-05-31 · L-02 내 건물 정보 등록 · ✅ · StabAn-NRH · 건축물대장 1:1 첨부. parseLedger + 수동. BuildingLedger(upsert), `PUT /buildings/:id/ledger`. report L-02.
- 2026-05-30 · L-01 내 건물 등록 (rev2) · ✅ · StabAn-NRH · 근저당권(을구) 추출 추가. 비전 구조화 추출 전환. Mortgage 모델(1:N). report rev2.
- 2026-05-30 · L-01 내 건물 등록 · ✅ · StabAn-NRH · 등기부등본 OCR→LLM 구조화 추출로 폼 자동완성 + 수동. Building 모델·임대인 가드.
- 2026-05-30 · 인증(회원가입/로그인) · ✅ · StabAn-NRH · Prisma(MySQL/RDS)+bcrypt+JWT. 유형별 앱 라우팅·역할 가드. Prisma v6 고정. Capacitor(Android) 구성.
- 2026-05-30 · C-01 OCR 스캐너 · ✅ · StabAn-NRH · PDF는 pdf-parse, 이미지·스캔본은 Claude 비전 폴백. 서버·클라 기반 부트스트랩 동반.
