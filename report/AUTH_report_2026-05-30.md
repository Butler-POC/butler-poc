<!-- Created: 2026-05-30 11:03 -->
# 인증(회원가입/로그인) — 구현 보고서

> 작성일: 2026-05-30 · 작업자: StabAn-NRH
> 범위: 회원가입·로그인, 사용자 유형(임대인/임차인/중개업자) 기반 역할 앱 라우팅·접근 제어

---

## 1. 무엇을 만들었나

- **회원가입** 시 사용자 유형(임대인/임차인/중개업자)을 선택해 계정에 고정한다.
- **로그인** 하면 유형에 맞는 앱(Butler Landlord / Tenant / Agent)으로 접속한다.
- 한 유형의 계정은 **자기 역할 앱만** 사용할 수 있다(타 역할 화면 접근 차단).
- 비밀번호는 **bcrypt 해시**로 저장하고, 세션은 **JWT 토큰**으로 유지한다.
- 계정은 **MySQL(AWS RDS) + Prisma**에 영속화한다.

---

## 2. 동작 흐름

```
[회원가입]  유형 선택 + 이름/이메일/비번 → POST /api/auth/signup
              → bcrypt 해시 저장 → JWT 발급 → 유형별 홈으로 이동

[로그인]    이메일/비번 → POST /api/auth/login
              → 비번 검증 → JWT 발급 → user.userType 에 따라
                LANDLORD→/app/landlord · TENANT→/app/tenant · AGENT→/app/agent

[보호 라우트]  요청 시 Authorization: Bearer <token> 자동 첨부(axios 인터셉터)
              → 서버 requireAuth 가 검증 → req.userId/userType 부착
```

### 역할 접근 제어 (이중 방어)

- **클라이언트(라우터 가드)** — 미로그인 시 `/login`, 로그인 상태에서 로그인/가입 화면 진입 시 자기 홈으로, **다른 역할 앱 경로 접근 시 자기 홈으로 차단**.
- **서버(미들웨어)** — `requireAuth`(JWT 검증), `requireRole(...)`(특정 역할만 허용). 현재 OCR(`/api/ocr/scan`)에 `requireAuth` 적용.

---

## 3. API

| 메서드 | 경로 | 인증 | 설명 |
|---|---|:---:|---|
| `POST` | `/api/auth/signup` | — | `{ email, password, name, userType }` → `{ token, user }` |
| `POST` | `/api/auth/login` | — | `{ email, password }` → `{ token, user }` |
| `GET` | `/api/auth/me` | 필요 | 현재 로그인 사용자 `{ user }` |

`userType` ∈ `LANDLORD | TENANT | AGENT`. 토큰 유효기간 7일.

### 검증 규칙

- 이메일 형식 확인, 비밀번호 **8자 이상**, 이름 필수, 유형 필수.
- 이메일 중복 → 409. 로그인 실패 → 401(이메일 존재 여부 비노출 위해 동일 메시지).

---

## 4. 데이터 모델 (Prisma · `users` 테이블)

```prisma
enum UserType { LANDLORD TENANT AGENT }

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String
  userType     UserType
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@map("users")
}
```

> **Prisma 버전 주의** — Prisma **6.x 로 고정**했다. 7.x 는 schema 의 `datasource url = env(...)` 방식을 폐기하고 `prisma.config.ts` + 드라이버 어댑터를 요구해 구성이 크게 달라진다. 업그레이드 시 마이그레이션 필요.

---

## 5. 추가/변경 파일

### 서버
| 파일 | 역할 |
|---|---|
| `prisma/schema.prisma` | User 모델 · UserType enum |
| `src/lib/prisma.ts` | PrismaClient 싱글톤 |
| `src/services/auth.service.ts` | 가입/로그인/토큰 검증 (bcrypt·JWT) |
| `src/middleware/auth.ts` | `requireAuth` · `requireRole` |
| `src/controllers/auth.controller.ts` · `src/routes/auth.ts` | 엔드포인트 |
| `src/types/user.ts` | UserType·DTO |
| `src/app.ts` · `src/routes/ocr.ts` | `/api/auth` 마운트 · OCR 보호 |

### 클라이언트
| 파일 | 역할 |
|---|---|
| `src/stores/auth.ts` | Pinia 인증 스토어(토큰·user, localStorage 지속) |
| `src/api/auth.ts` · `src/api/client.ts` | 인증 API · Bearer 토큰 인터셉터 |
| `src/router/index.ts` | 역할 라우팅·가드 |
| `src/views/auth/SignupView.vue` · `LoginView.vue` | 가입/로그인 화면 |
| `src/views/{landlord,tenant,agent}/*Home.vue` · `components/domain/RoleHome.vue` | 역할 앱 홈 |
| `src/components/layout/TopBar.vue` | 역할 칩 · 로그아웃 |
| `src/types/user.ts` | UserType · APP_META(앱이름·라벨·홈경로) |

---

## 6. 환경 변수 (`server/.env` 추가분)

| 키 | 설명 |
|---|---|
| `DATABASE_URL` | Prisma MySQL 연결 문자열 (DB_* 값으로 구성) |
| `JWT_SECRET` | 토큰 서명 키 (**운영 시 교체 필수**) |

DB 스키마 반영: `cd server && npm run db:push` (Prisma `db push`).

---

## 7. 검증 결과 (실제 RDS)

| 항목 | 결과 |
|---|:---:|
| 서버 타입체크 / 클라이언트 빌드 | ✅ 통과 |
| 회원가입(201) · 로그인 · `/me` | ✅ |
| 토큰 없는 `/me`·OCR → 401 | ✅ |
| 이메일 중복 → 409 / 비번 오류 → 401 / 짧은 비번 → 400 | ✅ |
| **토큰으로 OCR 스캔 → 200 추출 성공** | ✅ |
| 한글 이름 UTF-8 저장·복원(utf8mb4) | ✅ (`match: true`) |

> 클라이언트 라우팅 가드(역할별 접근 차단)는 빌드·로직 검증까지 완료. 브라우저 실측은 `npm run dev` 후 가입→자동 라우팅으로 확인 가능.

---

## 8. 한계 · 후속 과제

- **리프레시 토큰 없음** — 7일 만료 후 재로그인. 필요 시 refresh 토큰 도입.
- **이메일 인증/비밀번호 재설정 미구현**.
- **역할 앱 분리 미완** — 현재 단일 코드베이스에서 라우팅으로 분리. 추후 빌드 타깃 분리 검토(개요 참고).
- **OCR 외 보호 라우트 미적용** — 향후 기능(L-/T-/A-) 추가 시 `requireRole` 부착 필요.
- **JWT_SECRET 운영 교체** 및 HTTPS 백엔드 전제.
