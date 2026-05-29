<!-- Created: 2026-05-30 00:44 -->
# BUTLER — Design System

Butler 디자인 시스템 규격서. UI 작업 시 본 문서의 토큰·컴포넌트·레이아웃을 참고하세요.

---

## 1. 타입 (Typography)

**BUTLER — TYPOGRAPHY**

3-서체 시스템 · 1.2 minor third 스케일 (모바일 튜닝)

### TYPEFACES — 서체

| 서체 | 용도 |
|---|---|
| **Pretendard Variable** | 주력 UI 서체 (한글 우선, 우수한 라틴 글리프)<br>weights 400 / 500 / 600 / 700<br>fallback: `-apple-system, "Apple SD Gothic Neo", "Noto Sans KR"` |
| **Instrument Serif** | 디스플레이·워드마크·에디토리얼 전용 (항상 넉넉한 트래킹)<br>fallback: `"Iowan Old Style", Times New Roman, serif` |
| **JetBrains Mono** | 숫자/코드 (계약 ID, 토큰값) · 400 / 500<br>fallback: `ui-monospace, Menlo` |

### SIZE SCALE — 크기 스케일

| 토큰 | 크기 | | 토큰 | 크기 | | 토큰 | 크기 |
|---|---|---|---|---|---|---|---|
| xs | 11px | | sm | 13px | | md | 15px (본문 기본) |
| lg | 17px | | xl | 20px | | 2xl | 24px |
| 3xl | 30px | | 4xl | 38px | | 5xl | 48px |
| 6xl | 64px | | | | | | |

### LINE HEIGHT & TRACKING — 행간 · 자간

- **line-height** — tight 1.12 · snug 1.28 · body 1.55 · loose 1.72
- **tracking** — display -0.022em · tight -0.012em · normal 0 · wide +0.04em · eyebrow +0.14em

### DISPLAY TIER — 디스플레이 (Instrument Serif · 마케팅 전용)

| 스타일 | 규격 | 용도 |
|---|---|---|
| display-1 | serif · clamp(40 → 64px) · 1.12 · -0.022em · 400 | 히어로 헤드라인 |
| display-2 | serif · 38px · 1.12 · -0.022em · 400 | 섹션 디바이더 |

- ※ 강조어는 italic + brass-deep (예: 집의 *매니저*)
- ※ 제품 UI 본문에는 쓰지 않음 — large title / 마케팅 모먼트만

### HEADING TIER — 헤딩 (Pretendard)

| 스타일 | 규격 | 예시 |
|---|---|---|
| h1 | 30px / 1.28 / -0.012em / 700 | 계약을 마무리하세요 |
| h2 | 24px / 1.28 / -0.012em / 700 | 진행 중인 계약 |
| h3 | 20px / 1.28 / -0.012em / 600 | 보증금 반환 일정 |
| h4 | 17px / 1.28 / 600 | 서류 첨부 |

### BODY TIER — 본문 (Pretendard)

| 스타일 | 규격 | 용도 |
|---|---|---|
| body-lg | 17px / 1.55 / ink-2 | 강조 본문, 안내문 |
| body | 15px / 1.55 / ink-2 | 기본 본문 |
| body-sm | 13px / 1.55 / ink-2 | 보조 설명, 약관 |
| caption | 11px / 1.28 / ink-3 | 각주, 메타 |

### SUPPORTING — 보조 스타일

| 스타일 | 규격 |
|---|---|
| eyebrow | 11px / 600 / +0.14em / 대문자 / brass-ink<br>(slate 변형: ink-3 — 제품 내 테이블 헤더·섹션) |
| label | 12px / 500 / ink-2 — 폼 라벨 |
| link | 14px / ink · 1px 밑줄 · 3px offset · hover → brass-deep |
| mono | JetBrains · 0.95em · tnum — 계약 ID, 토큰 |
| numeric | Pretendard · tabular-nums (tnum) — 원장/금액 행<br>예) ₩12,000,000 · 200,000,000 |

### RULES — 규칙

- `font-feature-settings: "ss05","case","kern"` 기본 적용
- 금액·수치는 반드시 **tabular-nums** (정렬 흔들림 방지)
- 본문 최소 크기: 화면 13px / 슬라이드 24px / 인쇄 12pt
- `::selection` 은 brass-soft 틴트
- Inter/Roboto 등 대체 서체로 갈아끼우지 않기 — Pretendard가 한글 핵심

---

## 2. 컬러 (Color)

**BUTLER — COLOR PALETTE**

차갑고 진중한 잉크 + 종이색 바탕 + 황동(brass) 포인트 하나

### SURFACE — 표면 (바탕)

| 토큰 | oklch | hex | 용도 |
|---|---|---|---|
| paper | oklch(0.985 0.004 80) | ≈ #FBFAF6 | 기본 바탕 (따뜻한 오프화이트) |
| paper-sunk | oklch(0.965 0.005 80) | ≈ #F4F2ED | 섹션 띠, 테이블 헤더 |
| paper-raised | #ffffff | = #FFFFFF | 모달 (종이 위 순백) |

### INK — 글자색 (차가운 블루-블랙 스케일)

| 토큰 | oklch | hex | 용도 |
|---|---|---|---|
| ink | oklch(0.22 0.025 248) | ≈ #1E2331 | 본문/제목 (1차) |
| ink-2 | oklch(0.36 0.028 248) | ≈ #3A4151 | 보조 텍스트 |
| ink-3 | oklch(0.52 0.025 246) | ≈ #5E6675 | 3차 / 힌트 |
| ink-4 | oklch(0.68 0.020 246) | ≈ #8C939F | 플레이스홀더 / 비활성 |

### SLATE — 중립색 (테두리, 구분선, 보조 크롬)

| 토큰 | oklch | hex |
|---|---|---|
| slate-50 | oklch(0.975 0.006 246) | ≈ #F5F6F8 |
| slate-100 | oklch(0.948 0.008 246) | ≈ #ECEEF1 (기본 구분선) |
| slate-200 | oklch(0.910 0.010 246) | ≈ #DEE1E7 (기본 테두리) |
| slate-300 | oklch(0.852 0.013 246) | ≈ #CACFD8 |
| slate-400 | oklch(0.760 0.016 246) | ≈ #ABB2BE |
| slate-500 | oklch(0.640 0.020 246) | ≈ #838B99 |
| slate-600 | oklch(0.500 0.025 246) | ≈ #5C6475 |
| slate-700 | oklch(0.380 0.028 248) | ≈ #404757 |
| slate-800 | oklch(0.280 0.028 248) | ≈ #2B313F |
| slate-900 | oklch(0.190 0.025 248) | ≈ #1A1F2A |

### BRASS — 유일한 따뜻한 포인트색 (화면의 5% 이하로만)

| 토큰 | oklch | hex | 용도 |
|---|---|---|---|
| brass | oklch(0.72 0.105 76) | ≈ #C79A4A | CTA, 강조, 액센트 점 |
| brass-soft | oklch(0.93 0.040 80) | ≈ #EEE4CC | 틴트 배경 |
| brass-deep | oklch(0.58 0.105 70) | ≈ #9A7536 | 눌림 / 잉크 위 |
| brass-ink | oklch(0.32 0.060 70) | ≈ #50402A | 밝은 바탕 위 황동 텍스트 |

### SEMANTIC — 상태색 (낮은 채도, 잉크 지향 · 네온 금지)

| 토큰 | oklch | hex | 용도 |
|---|---|---|---|
| sage | oklch(0.58 0.075 162) | ≈ #4E8A6F | 성공 |
| sage-soft | oklch(0.94 0.030 162) | ≈ #DFEFE6 | |
| amber | oklch(0.73 0.130 78) | ≈ #CE9A3B | 주의 |
| amber-soft | oklch(0.95 0.045 80) | ≈ #F3E9CF | |
| crimson | oklch(0.55 0.155 24) | ≈ #B5443C | 위험/오류 |
| crimson-soft | oklch(0.95 0.030 24) | ≈ #F6E3DF | |
| indigo | oklch(0.46 0.095 252) | ≈ #3A5289 | 정보 (드물게) |
| indigo-soft | oklch(0.95 0.025 252) | ≈ #E3E7F2 | |

### 사용 원칙

- 바탕은 따뜻한 중립(paper), 글자는 차가운 잉크(ink) — 이 대비가 무드의 핵심
- **황동은 아주 아껴서** — CTA 하나, 강조 점 하나 정도. 절대 넓은 면적 채우지 말 것
- 상태는 색만으로 표시하지 말고 **아이콘 + 텍스트** 동반
- 그라데이션 배경 금지 (이미지 하단 보호 그라데이션만 예외)

---

## 3. 스페이싱 (Spacing & Structure)

**BUTLER — SPACING & STRUCTURE**

4px 기준 단위 · 8pt 리듬 우선

### SPACING — 여백 (4px base)

| 토큰 | 크기 | 용도 |
|---|---|---|
| s-1 | 2px | hairline 간격 |
| s-2 | 4px | 아이콘-텍스트 사이 |
| s-3 | 8px | 칩/버튼 내부, 인접 요소 |
| s-4 | 12px | 컴팩트 패딩 |
| s-5 | 16px | 기본 요소 간격 |
| s-6 | 20px | 모바일 좌우 거터(gutter) |
| s-7 | 24px | 카드 내부 패딩 |
| s-8 | 32px | 섹션 내 블록 간격 |
| s-9 | 40px | 섹션 간격 |
| s-10 | 56px | 큰 섹션 분리 |
| s-11 | 72px | 히어로 여백 |
| s-12 | 96px | 페이지 상하 여백 |

### RADII — 모서리 라운딩 (pill 외 16px 초과 금지)

| 토큰 | 크기 | 용도 |
|---|---|---|
| r-chip | 4px | 칩, 태그, 작은 토큰 |
| r-input | 8px | 입력 필드, 셀렉트 |
| r-card | 12px | 카드 |
| r-sheet | 16px | 바텀시트, 모달 |
| r-pill | 999px | 버튼(알약형), 토글, 배지 |

### SHADOW — 그림자 (차가운 잉크 틴트 · 글로우 금지)

| 토큰 | 값 | 용도 |
|---|---|---|
| shadow-1 | `0 1px 2px oklch(0.22 0.025 248 / .06), 0 1px 1px oklch(0.22 0.025 248 / .04)` | 쉬는 카드 (거의 안 보임) |
| shadow-2 | `0 4px 12px oklch(0.22 0.025 248 / .08), 0 1px 2px oklch(0.22 0.025 248 / .04)` | 호버 / 떠오른 상태 |
| shadow-3 | `0 24px 48px oklch(0.22 0.025 248 / .16), 0 4px 12px oklch(0.22 0.025 248 / .08)` | 시트, 모달 |
| shadow-inset | `inset 0 1px 0 oklch(0.22 0.025 248 / .04)` | 눌린 입력 필드 (드물게) |
| ring-focus | `0 0 0 2px paper, 0 0 0 4px brass` | 포커스 링 |

### MOTION — 모션 (소프트 ease-out · 바운스 금지)

| 토큰 | 값 | 용도 |
|---|---|---|
| ease-out | `cubic-bezier(0.22, 0.61, 0.36, 1)` | 진입(기본) |
| ease-in | `cubic-bezier(0.4, 0, 1, 1)` | 퇴장 |
| ease-inout | `cubic-bezier(0.65, 0, 0.35, 1)` | 이동 |
| d-micro | 120ms | 토글, 호버 등 미세 전환 |
| d-base | 200ms | 기본 전환 |
| d-sheet | 320ms | 바텀시트 등장 |
| d-page | 480ms | 페이지 전환 (6px 수직 슬라이드 + 페이드) |

### LAYOUT — 레이아웃 고정값

| 토큰 | 값 | 용도 |
|---|---|---|
| gutter-mobile | 20px | 모바일 좌우 거터 |
| gutter-web | 24px | 웹 컬럼 거터 |
| max-content | 1200px | 웹 콘텐츠 최대 폭 (12컬럼) |
| topbar-mobile | 56px | 모바일 상단 앱바 |
| topbar-web | 64px | 웹 상단 바 |
| tabbar | 64px | 모바일 하단 탭바 (+ safe area) |

### 리듬 원칙

- 세로 간격은 **8의 배수**를 우선 (8 / 16 / 24 / 32 / 40 …)
- 밀도는 **편안하게(comfortable)** — 부동산은 천천히 내리는 결정이라 빽빽하게 X
- 라운딩은 **16px가 상한** (pill 제외) — 그 이상은 가벼워 보임
- 그림자는 **회색이 아니라 잉크색** 저알파 — 글로우/컬러 섀도우 금지

---

## 4. 컴포넌트 (Components)

**BUTLER — COMPONENTS**

모두 위의 컬러·스페이싱 토큰을 사용. 아이콘은 Phosphor Regular 1.5px stroke.

### BUTTON — 버튼 (모두 pill / r-999)

**variants**

| variant | 스타일 | 용도 |
|---|---|---|
| primary | 배경 ink / 글자 paper | 주요 액션 |
| brass | 배경 brass / 글자 ink | 단 하나의 핵심 CTA에만 |
| secondary | 배경 paper / 글자 ink / 1px slate-300 보더 | |
| ghost | 투명 / 글자 ink | 저강조 |
| danger | 배경 paper / 글자 crimson / crimson 보더 | |

**sizes**

| size | 패딩 / 폰트 |
|---|---|
| sm | 7px 14px · 12px |
| md | 11px 20px · 14px |
| lg | 14px 24px · 15px |

- **weight** — 600
- **states**
  - hover — 배경 4% ink 쪽으로 / brass는 ~8% 어둡게
  - press — scale 0.98 (80ms in / 120ms out) · 기울임 X
  - focus — ring-focus (2px brass, 2px offset)
  - disabled — opacity 0.4 (색 변화 없음)
- **아이콘** — 선택적 leading/trailing · 16px · → 전각 화살표 선호

### INPUT — 입력 필드

- **field** — 패딩 11px 12px · r-input(8px) · 1px slate-300 보더 · 15px
  - label — 12px / 500 / ink-2 · 필드 위 6px gap
  - focus — 보더 ink 1.5px (네온/컬러 글로우 X)
  - error — 보더 crimson + 하단 11px crimson 메시지
  - prefix — ₩ 같은 기호 좌측 28px 들여쓰기 · 숫자는 tabular-nums
- **select** — 필드와 동일 스타일
- **checkbox** — 18px · r-chip(4px) · 체크 시 ink 배경 + paper ✓
- **toggle** — 38×22 pill · 켜짐 ink 트랙 + paper 노브
- **hit target** — 최소 44px (모바일)

### CARD — 카드

- **표준 카드** — 배경 paper-raised · r-card(12px) · 1px slate-100 보더 · shadow-1
  - 내부 — 패딩 18–20px · 요소 간 10px gap
  - eyebrow — 11px / 600 / +0.14em / 대문자 / brass-ink
  - title — 17px / 700 / ink
  - divider — 1px slate-100
- **강조 카드** — 배경 ink · 글자 paper · 황동은 eyebrow/액센트에만 (히어로 계약 카드)

※ 카드는 틴트 배경 위에 두지 않음 (paper → card → modal 위계)

### CHIP / BADGE — 칩 · 배지 (pill)

- **칩** — 패딩 4–5px 10–12px · 11–12px / 500–600
  - neutral — paper-sunk + slate-200 보더 / ink-2
  - brass — brass-soft / brass-ink (예: 전세)
  - ink — ink / paper (예: 관리자)
- **status** — soft 배경 + 6–7px 컬러 dot + 텍스트 (sage/amber/crimson)
  - ※ 색만으로 상태 표시 X — 항상 dot/아이콘 + 라벨 동반
- **count 배지** — ink 배경 / paper / tabular-nums (예: 3, 12, 99+)

### BANNER / TOAST — 배너 · 토스트

- **inline 배너** — soft 배경 + 같은 계열 보더 · r-card(12px) · 패딩 14px 16px
  - 구성 — 22px 원형 아이콘 + 제목(14/600) + 본문(12/ink-2) + 우측 텍스트 액션
  - variants — sage(성공) / amber(주의) / crimson(위험)
- **toast** — 배경 ink · 글자 paper · r-card · brass 원형 아이콘
  - 짧은 단문 ("저장되었습니다.") · 자동 소멸

### LIST ROW — 리스트 행

- **행** — 패딩 14px 세로 · 하단 1px slate-100 구분선 (마지막 행 제외)
  - leading — 36px · r-input(10px) · paper-sunk 아이콘 칩 (18px 아이콘)
  - body — 제목 14/600/ink + 부제 12/ink-3
  - trailing — 값(tabular-nums) + › 셰브론(ink-4)

### NAVIGATION — 내비게이션

- **top app bar** — 모바일 56px / 웹 64px · 스크롤 시 paper 80% + 16px backdrop-blur
  - large title — Instrument Serif 30–34px + 상단 brass eyebrow
- **bottom tab bar** — 64px(+safe area) · paper-raised · 상단 1px slate-100
  - 탭 — 22–24px 아이콘 + 10px 라벨 · 활성 ink + 하단 brass dot / 비활성 ink-3
  - ※ 탭바는 라벨 항상 표시. 그 외 아이콘은 라벨 동반

### PROPERTY CARD — 매물 카드 (도메인 특화)

- **구조** — 상단 이미지 140px (좌상단 type/status pill 오버레이)
  + 본문(제목 15/700, 면적 12/ink-3, 보증금·월세 tabular-nums)
  · r-card(12px) · slate-100 보더 · shadow-1

### 공통 원칙

- 모든 인터랙티브 요소는 **44px 이상 터치 타깃**
- **포커스 링 항상 노출** (2px brass)
- 상태는 **색 + 아이콘/텍스트** 조합 — 색만 쓰지 않기
- 바운스/오버슈트 없는 **소프트 ease-out** 전환

---

## 5. 브랜드 (Brand)

**BUTLER — BRAND**

버틀러: 임대인·임차인·중개사를 위한 부동산 서비스 플랫폼

브랜드 비유 — 잘 훈련된 집사(butler). 계약을 알고, 보증금 반환일을 기억하고, 조용히 정리한다. 절대 호들갑 떨지 않는다.

### LOGO — 로고

| 항목 | 규격 |
|---|---|
| 워드마크 | "Butler" (Instrument Serif, -2.5% 트래킹) + 'l' 위 brass 점(dot) |
| 심볼 | 라운드 사각(r 14px) ink 배경 + paper "B" + brass 점 |
| 태그라인 | "집의 매니저" |
| 보호 여백 | 심볼 높이의 최소 50% |
| 금지 | 늘이기/기울이기/그림자/그라데이션 채움, brass 외 색상 변경 |

### VOICE — 보이스

- **한 줄 요약** — 시니어 '매니저'처럼. 자신감 있고, 간결하고, 호들갑 없이.
  성인이 중요한 재무 결정을 내린다는 전제로 말한다.
- **어조** — 격식 있되 차갑지 않게
  - 합니다체 / 해요체 기본. 법적·중개 화면은 합니다체. 반말 절대 X
  - '고객님'은 아껴서. 보통은 행동/사실 자체로 말함
    - 예) "보증금 반환일이 30일 남았습니다." (O)
    - "고객님, 보증금 반환일이…" (지양)

### CASING & PUNCTUATION — 표기 규칙

| 항목 | 규칙 |
|---|---|
| 한글 헤드라인 | 단문은 끝에 마침표 X → "계약을 마무리하세요" |
| 한글 속 영문 | 원래 케이싱 유지 → "PDF로 내보내기" |
| 영문 제품 명사 | 소문자 (the dashboard, the contract) |
| 고유명사 | Title Case (Butler, Move-Out Checklist) |
| 숫자 | 콤마 구분 → 1,200만 원 또는 ₩12,000,000 (화면당 하나로 통일) |
| 날짜 | 밀집 화면 2026.04.18 (토) / 대화형 4월 18일 토요일 |
| 원화 기호 | ₩ (U+20A9) — "W"나 "won" X |

### TONE EXAMPLES — 톤 예시

| 상황 | ❌ 호들갑 | ✅ Butler |
|---|---|---|
| 빈 상태 | "아직 등록된 매물이 없어요! ✨" | "등록된 매물이 없습니다." |
| 성공 | "성공! 🎉" | "저장되었습니다." |
| 확인 | "정말 삭제하실 건가요?" | "삭제하면 되돌릴 수 없습니다." |
| CTA | "지금 바로 시작하기 →" | "계약 검토 시작" |
| 오류 | "앗! 문제가 발생했어요." | "전송에 실패했습니다. 다시 시도해 주세요." |

### EMOJI & SYMBOLS — 이모지 · 기호

- **이모지** — 제품 UI 내 사용 X · 마케팅 카피에서 낮은 빈도만 허용 · 오류/법적 화면 절대 X
- **유니코드** — ✓ ✕ ▸ 인라인 주석에 아껴서
- **화살표** — → (전각) 선호 · ➜ 👉 X
- **원화** — ₩

### ICONOGRAPHY — 아이콘

- **세트** — Phosphor Icons · Regular · 1.5px stroke (CDN)
  - → Pretendard 중간 굵기와 stroke가 맞고, 둥근 line-cap이 주거 느낌을 주되 만화 같지 않음
- **크기** — 밀집 행 20px · 주요 내비 24px · 빈 상태 32px
- **규칙**
  - 탭바 외에는 항상 라벨 동반
  - 이모지/유니코드를 아이콘 대용으로 쓰지 않기
  - 커스텀 SVG는 도메인 글리프(전세/월세 마커 등)에 한해, Phosphor Regular 광학 두께에 맞출 때만
  - ※ 사내 아이콘 세트가 생기면 CDN 교체

### TYPEFACES — 서체 (브랜드 차원)

- **Pretendard** — 주력 UI 서체 (한글 우선) · 400/500/600/700
- **Instrument Serif** — 디스플레이·워드마크·에디토리얼 모먼트 전용
- **JetBrains Mono** — 숫자/코드 (계약 ID, 토큰값 등)

### IMAGERY — 이미지 무드

- **사진** — 차갑고 살짝 채도 낮은 주광(daylight) · 한국 주거 내·외관
  - 악수하는 스톡 사진 X · 그레인(grain) 없음 · 은은하되 선명하게
- **제품 내 일러스트** — 사용 안 함 · 빈 상태는 brass 점 + 한 줄 카피로 처리
