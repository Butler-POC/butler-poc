// L-06 간단 법률 상담 — 시스템 프롬프트 빌더
// 단일 LLM(llm.service)로 호출하고, 모드는 이 프롬프트로 분기한다. (다른 AI 제공자/SDK로 교체 금지)
// 임대인의 건물·임차인 정보를 컨텍스트로 주입해 임대차·부동산 권리관계 상담을 제공한다.

export interface LegalContext {
  ownerName?: string;
  buildings: {
    address: string;
    tenants: {
      name?: string;
      unit?: string;
      deposit?: number;
      monthlyRent?: number;
      leasePeriod?: string; // 예) "2025.03.01 ~ 2027.02.28"
      overdue?: boolean; // L-04 월세 연체 여부 (rentState 계산값)
      overdueMonths?: number; // L-04 연체 개월 수 (overdue 일 때)
      specialTerms?: string; // L-03 특약사항
    }[];
  }[];
}

const won = (n?: number) => (typeof n === 'number' ? '₩' + n.toLocaleString('ko-KR') : '미상');

function renderContext(ctx: LegalContext): string {
  if (!ctx.buildings?.length) return '- 등록된 건물/임차인 정보가 없습니다.';
  return ctx.buildings
    .map((b) => {
      const tenants = b.tenants?.length
        ? b.tenants
            .map((t) => {
              const parts = [
                t.unit ? `${t.unit}` : '호실 미상',
                t.name ? `임차인 ${t.name}` : null,
                `보증금 ${won(t.deposit)}`,
                `월세 ${won(t.monthlyRent)}`,
                t.leasePeriod ? `계약기간 ${t.leasePeriod}` : null,
                t.overdue
                  ? `※ 월세 연체${t.overdueMonths ? ` ${t.overdueMonths}개월` : ''} 상태`
                  : null,
                t.specialTerms ? `특약: ${t.specialTerms}` : null,
              ].filter(Boolean);
              return `    · ${parts.join(' / ')}`;
            })
            .join('\n')
        : '    · 등록된 임차인 없음';
      return `- 건물: ${b.address}\n${tenants}`;
    })
    .join('\n');
}

export function buildLegalSystemPrompt(ctx: LegalContext): string {
  return [
    '당신은 한국의 임대차·부동산 권리관계를 다루는 버틀러의 법률 상담 어시스턴트입니다.',
    '아래 "관리 현황"은 상담을 요청한 임대인(오너) 본인의 실제 데이터입니다. 질문에 이 맥락을 반영해 답하세요.',
    '',
    `[관리 현황${ctx.ownerName ? ` · ${ctx.ownerName}` : ''}]`,
    renderContext(ctx),
    '',
    '[응답 규칙]',
    '- 합니다체로, 간결하고 차분하게 답합니다. 호들갑·이모지·과장 표현은 쓰지 않습니다.',
    '- 일반적인 법령·판례 경향과 실무 관행을 근거로 설명하되, 단정적 결론 대신 고려할 점과 절차를 안내합니다.',
    '- 금액은 ₩ 표기를 사용합니다.',
    '- 다툼의 소지가 크거나 권리·금전 영향이 큰 사안은 변호사·법률구조공단 등 전문가 상담을 권합니다.',
    '- 본 답변은 참고용이며 법적 효력이 없음을 인지하고 답합니다. (디스클레이머는 화면에서 별도 노출됩니다.)',
  ].join('\n');
}

// 디스클레이머 상수 — 서버/클라이언트 공통 문구 일치를 위해 export
export const LEGAL_DISCLAIMER = '참고용 · 법적 효력 없음';
