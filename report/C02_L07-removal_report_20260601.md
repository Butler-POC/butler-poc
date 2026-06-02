# 변경 작업 보고서 — L-07 제거 + C-02 챗봇 구현

- **작성일**: 2026-06-01
- **작업자**: jh
- **범위**: ① 기존 L-07(공실 등록) 기능 제거 ② C-02(챗봇) 구현 ③ L-06/T-02/T-03를 실제 C-02에 재배선

---

## A. L-07 공실 등록 제거

### 무엇을 / 왜
A-01·A-02가 공실(Vacancy) 도메인을 공유하므로, **L-07 "등록 기능"만 한정 제거**하고 Vacancy 모델·타입·조회는 보존했다.

### 코드 분석으로 확인한 의존
- A-01(`VacancyList.vue`)은 `vacancies.loadListing` / `listing`만 사용 → 등록과 무관.
- A-02(`OwnerChat.vue`)는 `vacancyRoomId`만 사용 → 등록과 무관.
- 따라서 등록(write) 경로만 제거해도 A-01·A-02는 영향 없음.

### 제거 (L-07 전용)
- `client/src/views/landlord/VacancyRegister.vue` — 삭제
- `server` `POST /api/vacancies` = `createVacancy` 컨트롤러 + 라우트 POST 라인 + 미사용된 `requireAuth` import
- `vacancy.controller.ts` `listVacancies` 의 `mine=true` 분기(L-07 내 목록 전용)
- `api/vacancies.ts` 의 `createVacancy`·`fetchMyVacancies`
- `stores/vacancies.ts` 의 `mine`·`loadMine`·`register`
- 타입 `VacancyCreateInput`(양쪽) — 등록 폼 전용

### 보존 (A-01·A-02 공유)
- `Vacancy` 모델(schema.prisma), `Vacancy`/`VacancyWithOwner`/`VacancyStatus` 타입(양쪽 동일)
- `GET /api/vacancies`(A-01), `fetchVacancies`, `listing`/`loadListing`, `vacancyRoomId`
- A-01·A-02 화면 일체

### 검증
- 제거 심볼 잔존 참조 grep → 0건.
- A-01/A-02가 참조하는 보존 심볼(`loadListing`,`vacancyRoomId`) 정상 존재.
- 타입 양쪽 일치 유지.
- (빌드/실행은 기반 미머지로 deferred — 정적 분석·참조 검사로 확인)

---

## B. C-02 챗봇 구현

이전 슬라이스에서 "이미 있다고 가정"했던 LLM 인프라를 실제로 구현했다.

### 서버
- **`config/env.ts`** (신규) — `.env`에서 키 로드(하드코딩 금지). Claude 키는 `API_KEY`.
- **`services/llm.service.ts`** (신규) — **외부 LLM 단일 호출기**. Anthropic SDK(`@anthropic-ai/sdk`), 모델 **`claude-opus-4-8`**. `chat({ system, messages }) => Promise<string>` 시그니처(기존 컨트롤러·서비스가 가정한 그대로라 재배선 최소). system 블록에 `cache_control`(프롬프트 캐싱; 프롬프트가 캐시 최소 토큰 초과 시 자동 적용). 비스트리밍 요청-응답(채팅 UI용).
- **`prompts/chat.prompt.ts`** (신규) — 분기 골격: 일반 페르소나(`BASE_BUTLER_SYSTEM`) + `MODE_DISCLAIMER` 맵. 모드별 상세는 각 기능 소관(legal.prompt/repairRate.prompt).
- **`controllers/chat.controller.ts`** (수정) — **`postChat` 디스패처** 추가: `mode` 로 `legal`/`repair`/`general` 분기. `generalChat`(기본 챗봇) 추가. 로컬 ChatMessage 타입을 `types/chat`로 교체.
- **`routes/chat.ts`** (신규) — `POST /api/chat`(`requireAuth`) → `postChat`.
- **`types/chat.ts`** (신규, 양쪽 동일) — `ChatRole/ChatMode/ChatMessage/ChatRequest/ChatResponse`.

### 클라이언트
- **`api/chat.ts`** (신규) — `postChat({ mode, message, history })`.
- **`stores/chatbot.ts`** (신규) — LLM 대화 상태 스토어.
- **`components/domain/IssueChat.vue`** (신규) — 재사용 LLM 채팅 UI. `mode` prop 분기, **디스클레이머 prop/슬롯** 제공(강제 노출은 호출 측 결정), Design.md 말풍선·보이스 준수.

### ⚠️ A-02 충돌 회피 결정 (중요)
A-02(`VacancyChat.vue`)는 `stores/chat.ts`를 **소켓 실시간 스토어**(`joinRoom/send/messages/threads`)로 가정 중이다. C-02는 **LLM 요청-응답**이라 성격이 전혀 달라, `stores/chat.ts`를 LLM용으로 덮어쓰면 A-02가 깨진다. 따라서 C-02 스토어를 **`stores/chatbot.ts`**로 분리했다(지시서의 "stores/chat" 문구에서 의도적 이탈). 두 채팅 시스템은 별개:
- **C-02**: LLM 챗봇 = `chatbot` 스토어 + `api/chat` + `IssueChat.vue`
- **A-02**: 사람-사람 실시간 = 소켓 `chat` 스토어(기반) + `VacancyChat.vue`

---

## C. L-06 / T-02 / T-03 재배선

이전엔 C-02를 "가정"하고 올렸는데, 이제 실제 C-02를 소비한다 — **세 기능은 재작성하지 않고 배선만 확인**:
- `chat.controller`의 `legalChat`/`repairChat`이 실제 `llm.service.chat` 호출(이미 그 시그니처로 작성됨 → 무수정 연결).
- `repairRate.service`의 `assessRepairRate`가 실제 `llm.service.chat` 호출(무수정 연결 확인).
- `routes/chat`의 `postChat`이 `mode:'legal'→legalChat`, `mode:'repair'→repairChat` 위임 → 프론트(`LegalChat.vue`, `api/issues.repairChat`)의 기존 `POST /api/chat` 호출이 실제로 동작.
- 컨트롤러 헤더의 "가정한 인터페이스(llm.service)" 주석을 "실제 의존"으로 갱신.
- 디스클레이머(L-06/T-02)는 화면에서 그대로 유지.

---

## 실동작 검증 (이번에 가능)
- **Claude API 실호출 확인** — 프로젝트 키 + `claude-opus-4-8` + `llm.service`와 동일한 요청형태(system 배열/messages/max_tokens)로 정상 응답(`stop_reason: end_turn`), 텍스트 추출 로직 일치.
- 전체 빌드/실행은 기반(prisma·auth·app.ts·router·api/client·pinia) 미머지로 **deferred**.

## 가정한 기반 인터페이스 (머지 시 정합)
| 대상 | 가정 |
|---|---|
| `@anthropic-ai/sdk` | 기반 `server/package.json`에 의존성 추가 필요 |
| `lib/prisma`, `middleware/auth` | 기존과 동일 |
| `stores/chat.ts`(소켓) | A-02 전용으로 **보존**(C-02가 건드리지 않음) |
| `api/client` | axios 인스턴스 |

## 머지 시 연결 (TODO)
1. `app.ts`: `app.use('/api/chat', chatRouter)` (+ 기존 vacancies/issues/vendors).
2. `server/package.json`: `@anthropic-ai/sdk` 추가, 서버 부트스트랩이 `.env` 로드(dotenv).
3. `router/index.ts`: 일반 챗봇 화면을 둘 경우 `IssueChat` 사용 라우트(선택).
4. (선택) DRY — L-06 `LegalChat.vue`/T-02 `DefectChat.vue`를 공용 `IssueChat.vue`로 수렴.

## 미해결 / 비고
- LLM 응답 품질·디스클레이머 노출은 통합 후 UI에서 최종 확인.
- 프롬프트 캐싱은 현재 시스템 프롬프트가 짧아(<캐시 최소 토큰) 실제 캐시는 트리거되지 않음 — 컨텍스트가 커지면 자동 적용.
