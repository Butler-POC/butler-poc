<!-- Created: 2026-05-30 00:39 -->
# Butler 프로젝트

협업 프로젝트의 작업 가이드라인입니다. 작업 시작 전 반드시 본 문서를 참고하세요.

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
│   ├── .env.local              # VITE_KAKAO_JS_KEY
│   ├── public/
│   │   ├── icons/              # 집사 아이콘 4종...
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
    ├── .env                    # 로컬 키 + DATABASE_URL="file:./dev.db"
    ├── prisma/
    │   ├── schema.prisma       # provider = "sqlite"
    │   ├── dev.db              # 로컬 DB 파일 (gitignore)
    │   └── seed.ts
    ├── uploads/                # OCR 문서 로컬 저장 (gitignore)
    │   ├── registry/           # 등기부등본
    │   ├── contracts/          # 계약서
    │   └── buildings/          # 건축물대장
    └── src/
        ├── index.ts            # listen + Socket.io
        ├── app.ts              # express 설정 (cors·json·static /uploads)
        ├── config/env.ts
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
