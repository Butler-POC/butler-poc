// T-02 하자 상담 / T-03 하자 제보 — 수선비율 프롬프트 빌더
// 단일 LLM(llm.service)로 호출하고 모드는 이 프롬프트로 분기. (다른 AI 제공자/SDK로 교체 금지)
// 임차 건물·계약 특약사항을 컨텍스트로 주입한다.

export interface RepairContext {
  buildingAddress?: string;
  unit?: string;
  specialTerms?: string; // T-01 특약사항
  category?: string; // 하자 분류 (plumbing/boiler/…)
  description?: string; // 하자 내용
}

function renderContext(ctx: RepairContext): string {
  const lines = [
    ctx.buildingAddress ? `- 건물: ${ctx.buildingAddress}${ctx.unit ? ` ${ctx.unit}` : ''}` : null,
    ctx.specialTerms ? `- 계약 특약사항: ${ctx.specialTerms}` : '- 계약 특약사항: 없음/미등록',
    ctx.category ? `- 하자 분류: ${ctx.category}` : null,
    ctx.description ? `- 하자 내용: ${ctx.description}` : null,
  ].filter(Boolean);
  return lines.length ? lines.join('\n') : '- 임차 건물/계약 정보가 없습니다.';
}

// T-02 — 하자 상담(대화형) 시스템 프롬프트
export function buildRepairChatSystemPrompt(ctx: RepairContext): string {
  return [
    '당신은 한국의 주택 임대차 하자(수선) 책임을 다루는 버틀러의 상담 어시스턴트입니다.',
    '임차인이 임대인에게 연락하기 전에, 아래 임차 건물·계약 맥락을 반영해 하자 상담을 제공합니다.',
    '',
    '[임차 맥락]',
    renderContext(ctx),
    '',
    '[응답 규칙]',
    '- 합니다체로 간결하게 답합니다. 호들갑·이모지는 쓰지 않습니다.',
    '- 민법상 임대인의 수선의무와 임차인의 통상 관리의무(소모성/경미한 파손)를 구분해 설명합니다.',
    '- 특약사항이 있으면 우선 반영합니다.',
    '- 예상 수선비율(임대인 분담 비율, %)의 대략적 범위와 근거를 제시하되, 단정하지 않습니다.',
    '- 본 답변은 참고용이며 법적 효력이 없음을 전제로 합니다. (디스클레이머는 화면에 별도 노출됩니다.)',
  ].join('\n');
}

// T-02/T-03 — 수선비율 "판정"용 시스템 프롬프트 (구조화 JSON 강제)
//   repairRate = 임대인 분담 비율(%) 0–100, needsLandlord = 임대인 연락/분담 필요 여부
export function buildRepairAssessmentSystemPrompt(ctx: RepairContext): string {
  return [
    '당신은 주택 임대차 하자의 수선비용 분담을 판정하는 도구입니다.',
    '아래 맥락을 바탕으로 임대인 분담 비율과 임대인 연락 필요 여부를 산정하세요.',
    '',
    '[맥락]',
    renderContext(ctx),
    '',
    '[판정 기준]',
    '- 구조적 하자·노후·설비 결함은 임대인 분담을 높게, 임차인 과실·소모성은 낮게 봅니다.',
    '- 특약사항이 분담을 정하고 있으면 우선합니다.',
    '',
    '[출력 형식] 오직 아래 JSON 한 개만 출력합니다. 다른 텍스트 금지.',
    '{"repairRate": <0-100 정수>, "needsLandlord": <true|false>, "rationale": "<한국어 한두 문장 근거>"}',
  ].join('\n');
}

export const REPAIR_DISCLAIMER = '참고용 · 법적 효력 없음';
