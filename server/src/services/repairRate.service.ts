// 수선비율 결정 서비스 — T-02 상담 판정 / T-03 제보 시 임대인 연락 필요 여부 판정
//
// 가정한 기반 인터페이스:
//   - '../services/llm.service' 의 chat({ system, messages }) => Promise<string> (단일 LLM)
import { chat } from './llm.service';
import {
  buildRepairAssessmentSystemPrompt,
  type RepairContext,
} from '../prompts/repairRate.prompt';
import type { RepairRateAssessment } from '../types';

// 임대인 연락이 필요하다고 보는 분담 비율 임계치(%)
const NEEDS_LANDLORD_THRESHOLD = 30;

function clampRate(n: unknown): number {
  const v = Math.round(Number(n));
  if (Number.isNaN(v)) return 0;
  return Math.min(100, Math.max(0, v));
}

// 분담 비율 + 분류로 임대인 연락 필요 여부를 결정적으로 보정
export function decideNeedsLandlord(repairRate: number, aiNeedsLandlord?: boolean): boolean {
  if (repairRate >= NEEDS_LANDLORD_THRESHOLD) return true; // 임대인 분담이 크면 무조건 연락
  return Boolean(aiNeedsLandlord);
}

// LLM 응답 문자열에서 JSON 1개를 안전하게 파싱
function parseAssessment(raw: string): RepairRateAssessment | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const obj = JSON.parse(match[0]);
    const repairRate = clampRate(obj.repairRate);
    return {
      repairRate,
      needsLandlord: decideNeedsLandlord(repairRate, obj.needsLandlord),
      rationale: typeof obj.rationale === 'string' ? obj.rationale : '',
    };
  } catch {
    return null;
  }
}

// T-02/T-03 — 하자 맥락으로 수선비율 판정
export async function assessRepairRate(ctx: RepairContext): Promise<RepairRateAssessment> {
  const system = buildRepairAssessmentSystemPrompt(ctx);
  const raw = await chat({
    system,
    messages: [{ role: 'user', content: '위 하자에 대한 수선비율을 판정해 주세요.' }],
  });

  const parsed = parseAssessment(raw);
  if (parsed) return parsed;

  // LLM 파싱 실패 시 보수적 기본값(판단 보류 → 임대인 연락 권장)
  return {
    repairRate: 0,
    needsLandlord: true,
    rationale: '자동 판정에 실패하여 임대인 확인을 권장합니다.',
  };
}
