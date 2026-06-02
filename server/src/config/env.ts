// 환경변수 로더 — 키는 .env 에서만 읽는다(하드코딩 금지).
// 서버 부트스트랩(index.ts, 기반)이 dotenv 등으로 .env 를 process.env 에 로드한다고 가정.
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`환경변수 ${name} 가 설정되지 않았습니다.`);
  return v;
}

export const env = {
  // Claude API 키 (.env 키 이름: API_KEY) — 접근 시점에 검증(lazy)
  get anthropicApiKey(): string {
    return required('API_KEY');
  },
  // Kakao 로컬 검색 REST 키 (L-05)
  kakaoRestKey: process.env.KAKAO_REST_KEY ?? '',
  databaseUrl: process.env.DATABASE_URL ?? '',
};
