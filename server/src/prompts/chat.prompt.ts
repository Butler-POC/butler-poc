// C-02 챗봇 — 프롬프트 분기 골격 + 일반(general) 모드 시스템 프롬프트.
// 모드별 상세 프롬프트는 각 기능 소관: legal → legal.prompt.ts(L-06), repair → repairRate.prompt.ts(T-02/03).
// 여기서는 "분기 구조"와 기본 챗봇 페르소나만 둔다.
import type { ChatMode } from '../types';

// 일반 챗봇 페르소나 (특정 도메인 컨텍스트 주입 없음)
export const BASE_BUTLER_SYSTEM = [
  '당신은 버틀러(Butler)의 도우미입니다. 부동산 임대 관리 서비스 사용자를 돕습니다.',
  '합니다체로 간결하고 차분하게 답합니다. 호들갑·이모지·과장 표현은 쓰지 않습니다.',
  '금액은 ₩ 표기를 사용합니다.',
  '법률 판단이나 하자 수선 책임처럼 전문 영역은 단정하지 않고, 해당 상담 메뉴(법률 상담/하자 상담)를 안내합니다.',
].join('\n');

// 모드 → 디스클레이머 노출 여부 (법률·하자 AI 출력엔 "참고용·법적 효력 없음" 필수)
export const MODE_DISCLAIMER: Record<ChatMode, string | undefined> = {
  general: undefined,
  legal: '참고용 · 법적 효력 없음',
  repair: '참고용 · 법적 효력 없음',
};
