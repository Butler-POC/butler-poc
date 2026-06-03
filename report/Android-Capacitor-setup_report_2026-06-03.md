<!-- Created: 2026-06-03 20:41 -->
# Android(Capacitor) 네이티브 실행 설정 — 작업 보고서

- 작성일: 2026-06-03
- 작업자: StabAn-NRH
- 범위: Android Studio에서 앱 실행 준비(Capacitor 정적 빌드)

---

## 1. 개요

Capacitor는 정적 빌드 방식(`webDir: dist`)으로 구성돼, 네이티브 앱은 번들된 `dist`를 로드한다. 이때 Vite 프록시가 없으므로 **백엔드 절대주소**가 필요하고, http 백엔드를 호출하려면 **cleartext 허용**이 필요하다.

## 2. 설정 내용

### 2-1. 네이티브용 API 주소
- `client/.env.production` 생성: `VITE_API_BASE=http://10.0.2.2:3000/api`
  - 안드로이드 **에뮬레이터는 PC의 localhost를 `10.0.2.2`** 로 접근. 실기기는 PC LAN IP로 교체.
  - `.env.production`은 `npm run build`에만 적용 → 웹 `npm run dev`는 기존 `/api` 프록시 유지.
- 빌드 번들에 주소가 주입됨을 확인.

### 2-2. cleartext(http) 허용
- `client/capacitor.config.ts`에 `server: { androidScheme: 'http', cleartext: true }` 추가.
  - 백엔드가 https가 아니므로 필요. 웹뷰 origin도 http로 맞춰 mixed-content 차단을 회피.
  - 운영 배포(https 백엔드) 시에는 이 server 블록 제거.

### 2-3. 동기화
- `npm run build` → `npx cap sync android` 완료(동기화된 `capacitor.config.json`에 server 블록 반영 확인).

## 3. 실행 절차(사용자)

1. 백엔드 실행 유지(`npm --prefix server run dev`).
2. `npx --prefix client cap open android` → Android Studio.
3. 에뮬레이터/디바이스 선택 후 Run.
- 웹 코드 변경 시마다 `npm run build` + `cap sync android` 후 재실행.

## 4. 제약 / 비고

- **Kakao 지도(L-05)**: JS 키가 `localhost:5173` 도메인에 묶여 있어, 네이티브 origin(`http://localhost`)에선 지도가 제한될 수 있음(키 도메인 등록 필요). 그 외 기능은 정상.
- Express 서버는 모든 인터페이스에 바인딩되어 에뮬레이터/LAN에서 접근 가능. 실기기는 방화벽 3000 인바운드 허용 필요.
- 실시간 채팅(socket.io)도 `VITE_API_BASE` 기준 동일 백엔드로 연결.
