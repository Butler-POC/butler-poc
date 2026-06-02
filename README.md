<!-- Created: 2026-05-30 10:35 -->
# butler-poc

2026년 한국항공대학교 AI융합 Capstone Design의 버틀러 팀 POC 프로젝트 저장소입니다.

임대인·임차인·중개업자를 위한 생애주기 자산 AI 관리 **모바일 애플리케이션**입니다.
(자세한 작업 가이드는 [`CLAUDE.md`](./CLAUDE.md) 참고)

## 구성

| 폴더 | 내용 |
|---|---|
| `client/` | Vue 3 + Vite 모바일 앱 (PWA → Capacitor 네이티브 패키징) |
| `client/android/` | Capacitor가 생성한 Android 네이티브 프로젝트 |
| `server/` | Express(TypeScript) API 서버 |

---

## 1. 사전 준비

- **Node.js 18+** (개발은 24에서 확인)
- 안드로이드 앱 빌드 시: **Android Studio** (JDK + Android SDK 포함)
- `server/.env` 에 키 설정 (아래 참고)

## 2. 설치

```bash
npm run install:all      # 루트 + client + server 의존성 한 번에 설치
```

## 3. 개발 실행 (웹/PWA)

```bash
npm run dev              # server(:3000) + client(:5173) 동시 실행
```

브라우저에서 `http://localhost:5173` → 모바일 화면(데스크톱은 폰 프레임 안)으로 확인합니다.

---

## 4. 모바일 앱(Android) 빌드

웹앱을 Capacitor로 감싸 **설치 가능한 `.apk`** 로 빌드합니다.

### 4-1. 웹 빌드 → 네이티브 동기화

```bash
cd client

# (네이티브 앱은 Vite 프록시가 없으므로, 백엔드 절대주소를 지정한다)
#   PowerShell:  $env:VITE_API_BASE="http://<백엔드주소>:3000/api"
#   bash:        export VITE_API_BASE="http://<백엔드주소>:3000/api"
npm run build            # dist/ 생성
npx cap sync android     # dist → android 프로젝트로 복사
```

### 4-2. APK 빌드 — 방법 A: Android Studio (권장)

```bash
npx cap open android     # Android Studio로 프로젝트 열기
```

Android Studio에서 **Build → Build Bundle(s) / APK(s) → Build APK(s)** 를 누르면
`client/android/app/build/outputs/apk/debug/app-debug.apk` 가 생성됩니다.

### 4-2. APK 빌드 — 방법 B: 명령줄

Android SDK·JDK가 설정돼 있으면:

```bash
cd client/android
./gradlew assembleDebug   # Windows: .\gradlew.bat assembleDebug
```

> **참고**
> - 앱 ID: `com.butler.app` · 앱 이름: `Butler`
> - 백엔드가 `http://`(비암호화)면 안드로이드의 cleartext 허용 설정이 필요할 수 있습니다.
>   운영 배포 시에는 `https://` 백엔드를 권장합니다.
> - **iOS(.ipa)** 빌드는 macOS + Xcode 환경에서 `npx cap add ios` 후 진행합니다. (현재 Windows에서는 불가)

---

## 5. 환경 변수

### `server/.env`

| 키 | 설명 |
|---|---|
| `API_KEY` | Claude(Anthropic) API 키 (OCR 비전·챗봇용) |
| `DB_HOST` / `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | MySQL 접속 정보 |
| `LLM_MODEL` | (선택) 사용할 모델. 기본 `claude-sonnet-4-6` |
| `PORT` | (선택) 서버 포트. 기본 `3000` |

### `client/.env` (네이티브 빌드 시)

| 키 | 설명 |
|---|---|
| `VITE_API_BASE` | 백엔드 절대주소. 미지정 시 `/api` (웹 개발용 프록시) |
