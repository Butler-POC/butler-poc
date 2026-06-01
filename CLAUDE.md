<!-- Created: 2026-05-30 00:39 -->
# Butler 프로젝트

협업 프로젝트의 작업 가이드라인입니다. 작업 시작 전 반드시 본 문서를 참고하세요.

---

## 0. 개요

**Butler** — 임대인·임차인·중개업자를 위한 **생애주기 자산 AI 관리 플랫폼**.
계약을 알고, 보증금 반환일을 기억하고, 조용히 정리하는 '집사'를 지향한다.

### 서비스 구성 — 역할별 3개 앱

Butler 플랫폼은 **사용자 역할별로 분리된 3개의 서비스 앱**으로 제공된다. 각 앱은 자신의 역할 기능만 노출·사용한다.

| 앱 | 대상 | 사용 기능 |
|---|---|---|
| **Butler Landlord** | 임대인 | 임대인 기능(L-) 전용 |
| **Butler Tenant** | 임차인 | 임차인 기능(T-) 전용 |
| **Butler Agent** | 중개업자 | 중개업자 기능(A-) 전용 |

- 공통 기능(C- : OCR·챗봇)과 인증(로그인/가입)은 **세 앱이 공통**으로 사용한다.
- 한 앱에서 다른 역할의 기능은 노출되지 않는다. (예: Tenant 앱에는 임대인 기능 없음)
- 백엔드(Express)·데이터베이스(MySQL)는 **3개 앱이 공유**하는 단일 서버다.

> 구현 현황: 현재 `client/`는 세 역할 화면(`views/landlord|tenant|agent`)을 한 코드베이스에 담고 있다. 추후 역할별 앱으로 분리(빌드 타깃 분리 또는 별도 진입점)할 예정이며, 본 절은 그 목표 구조를 정의한다.

### 산출물

- **모바일 애플리케이션 3종**(Landlord·Tenant·Agent) — 각 앱을 Vue 기반 모바일 퍼스트 웹앱으로 만들고 **Capacitor로 감싼 네이티브 앱**(Android `.apk` / iOS `.ipa`)으로 패키징한다. 웹/PWA로도 그대로 실행된다.
- 세로(portrait) 모바일 뷰포트가 기준. 데스크톱 브라우저에서는 **폰 프레임(PhoneFrame)** 안에서 모바일 화면으로 확인한다.
- 네이티브 프로젝트는 `client/android/`(Capacitor 생성). 빌드 절차는 `README.md` 참고.

### 기술 스택

| 레이어 | 스택 |
|---|---|
| 프론트엔드 | Vue 3 + Vite + TypeScript · Pinia · Vue Router — 모바일 퍼스트, **Capacitor** 네이티브 패키징 |
| 백엔드 | Express + TypeScript |
| 데이터베이스 | MySQL · Prisma |
| 외부 연동 | Claude(Anthropic) LLM · Kakao 지도 |

### 개발 원칙

- **모바일 퍼스트** — 모든 화면은 세로 모바일 뷰포트(safe-area 포함)를 기준으로 설계한다.
- UI 규격은 `Design.md`(Paper/Ink/Brass 토큰 · 56px 앱바 · 하단 탭바)를 따른다.

---

## 1. 디렉토리 구조

```
butler/
├── package.json                # 루트: client+server 동시 실행
├── README.md
├── Implementation_log.md
├── Design.md
├── report/
│
├── client/                     # ════ Vue 3 + Vite (localhost:5173) ════
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts          # @ 별칭 + /api 프록시 (shared 별칭 없음)
│   ├── tsconfig.json
│   ├── public/
│   │   ├── icons/              # 집사 아이콘 4종
│   │   └── manifest.json       # PWA
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       ├── assets/tokens.css   # Paper/Ink/Brass 토큰
│       ├── types/              # ★ 프론트 도메인 타입 (독립 보유)
│       │   ├── user.ts
│       │   ├── building.ts
│       │   ├── tenant.ts
│       │   ├── issue.ts
│       │   └── index.ts
│       ├── router/index.ts     # 라우트 = IA
│       ├── stores/             # Pinia (auth/buildings/tenants/chat)
│       ├── api/                # axios 래퍼 (→ /api)
│       │   ├── client.ts
│       │   ├── buildings.ts
│       │   ├── ocr.ts
│       │   ├── chat.ts
│       │   └── vendors.ts
│       ├── composables/        # useAuth, useKakaoMap
│       ├── components/
│       │   ├── ui/             # BaseButton.vue, BaseCard.vue, Badge.vue …
│       │   ├── layout/         # TopBar.vue, TabBar.vue, PhoneFrame.vue
│       │   └── domain/         # BuildingCard.vue, TenantRow.vue, IssueChat.vue, VendorMap.vue
│       └── views/              # 화면 (IA 4영역)
│           ├── auth/           # 공통 S- (Login/Signup)
│           ├── landlord/       # 임대인 L- 14화면
│           ├── tenant/         # 임차인 T- 8화면
│           └── agent/          # 중개업자 B- 4화면
│
└── server/                     # ════ Express (localhost:3000) ════
    ├── package.json
    ├── tsconfig.json           # @ 별칭 (shared 별칭 없음)
    ├── .env                    # 로컬 키 + MySQL DATABASE_URL
    ├── prisma/
    │   ├── schema.prisma       # provider = "mysql"
    │   └── seed.ts
    ├── uploads/                # OCR 문서 로컬 저장 (gitignore)
    │   ├── registry/           # 등기부등본
    │   ├── contracts/          # 계약서
    │   └── buildings/          # 건축물대장
    └── src/
        ├── index.ts            # listen + Socket.io
        ├── app.ts              # express 설정 (cors·json·static /uploads)
        ├── types/              # ★ 백엔드 도메인 타입 (독립 보유)
        │   ├── user.ts
        │   ├── building.ts
        │   ├── tenant.ts
        │   ├── issue.ts
        │   └── index.ts
        ├── routes/             # auth/buildings/tenants/issues/vacancies/ocr/chat/vendors
        ├── controllers/        # 요청 핸들러
        ├── services/           # 외부 API
        │   ├── ocr.service.ts
        │   ├── llm.service.ts
        │   ├── repairRate.service.ts
        │   └── kakao.service.ts
        ├── prompts/            # legal.prompt.ts, repairRate.prompt.ts
        ├── middleware/         # auth, upload(multer), error
        ├── sockets/chat.socket.ts
        └── lib/prisma.ts
```

---

## 2. 기능사항

### 공통기능

| 기능 코드 | 기능명 | 기능 설명 |
|---|---|---|
| C-01 | OCR 스캐너 | PDF나 이미지 파일에서 텍스트를 추출 |
| C-02 | 챗봇 | 외부 LLM 모델 API에 프롬프트를 보내고 응답을 가공하여 채팅 형식의 서비스 구현 |

### 임대인기능

| 기능 코드 | 기능명 | 기능 설명 |
|---|---|---|
| L-01 | 내 건물 등록 | OCR 스캔, 또는 수동 입력으로 등기부등본 정보를 등록 |
| L-02 | 내 건물 정보 등록 | OCR 스캔, 또는 수동 입력으로 건축물대장 정보를 등록 |
| L-03 | 임차인 등록 | OCR 스캔, 또는 수동 입력으로 임대차계약서 정보를 등록 |
| L-04 | 임차인 월세 연체 강조 표시 | 월세가 연체된 임차인을 강조 표시 |
| L-05 | 수선 업체 조회 | 건물 관리와 관련된 업체를 조회 |
| L-06 | 간단 법률 상담 | 현재 관리 중인 건물과 임차인 정보를 바탕으로 챗봇과 간단한 법률 상담 구현 |
| L-07 | 공실 등록 | 세입자를 구할 공실을 등록 |

### 임차인기능

| 기능 코드 | 기능명 | 기능 설명 |
|---|---|---|
| T-01 | 임차 건물 등록 | OCR 스캔, 또는 수동 입력으로 임대차계약서 정보를 등록 |
| T-02 | 하자 상담 | 현재 임차 중인 건물과 계약서의 특약사항 정보를 바탕으로 챗봇과 하자에 대해 상담할 수 있는 기능 |
| T-03 | 하자 제보 | 하자 내용과 제안할 수선 비율을 임대인에게 제보 |

### 중개업자기능

| 기능 코드 | 기능명 | 기능 설명 |
|---|---|---|
| A-01 | 공실 조회 | 소유권자가 등록한 공실 조회 |
| A-02 | 건물주 연결 | 소유권자와 공실에 대해 채팅할 수 있는 기능 |

---

## 3. 작업 흐름

1. **시작 전** — `Implementation_log.md`에서 남은 작업 확인 후 착수
2. **UI 작업 시** — `Design.md`의 디자인 규격(토큰·컴포넌트·레이아웃) 참고
3. **작업 후-1** — `Implementation_log.md` 갱신: 상태·완료일시·작업자·진행 현황 (간결한 추적용)
4. **작업 후-2** — 기능 구현이 완료되면 `report/` 디렉토리 내에 사람이 읽기 쉽게 정리하여 md 보고서 작성

---

## 4. `report/` 보고서 작성 가이드

1. 파일 명은 `기능코드_report_작성날짜` 형식
2. 같은 기능에 수정사항이 있어 보고서를 다시 작성해야 할 때는 기존 보고서를 덮어쓰지 않고 새로 작성한다.

---

## 5. 참고 사항

- `Implementation_log.md` = **진행 상태 추적**(체크리스트)
- `report/` 디렉토리 내의 보고서들 = **작업 과정 설명**(사람용 서술)
- 둘은 역할이 다르니 매번 함께 갱신할 것
