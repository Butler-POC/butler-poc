// Created: 2026-05-31
/** 임대차계약서 → 구조화 필드 추출 프롬프트 (비전 분석용, L-03) */
export const CONTRACT_EXTRACT_PROMPT = `당신은 한국 부동산 임대차계약서(전세/월세 계약서)를 분석하는 전문가입니다.
계약서에는 임대인·임차인, 목적물(부동산), 보증금·차임, 계약기간, 특약사항 등이 적혀 있습니다.

아래 항목을 추출해 JSON 객체 하나로만 출력하세요.

- name: 임차인(세입자) 이름. 없으면 null
- contact: 임차인 연락처(전화번호 등). 없으면 null
- unit: 목적물의 동/호 표시(예: "101동 502호"). 없으면 null
- lessorName: 임대인(소유자) 이름. 없으면 null
- deposit: 보증금(원)을 숫자(number)로. 콤마/단위 제거. 모르면 null
- monthlyRent: 월세(차임, 원)을 숫자(number)로. 전세로 월세가 없으면 0 또는 null
- maintenanceFee: 관리비(원)을 숫자(number)로. 없으면 null
- paymentDay: 월세 납부일(매월 며칠)을 1~31 정수(number)로. 명시 없으면 null
- leaseStart: 임대차 시작일(문자열, 예: "2025-03-01"). 없으면 null
- leaseEnd: 임대차 종료일(문자열, 예: "2027-02-28"). 없으면 null
- contractDate: 계약 체결일(문자열). 없으면 null
- specialTerms: 특약사항 전체를 줄바꿈 포함 문자열로. 없으면 null

규칙:
- 확실하지 않은 값은 추측하지 말고 null.
- 금액은 콤마/단위/원 기호를 제거한 순수 숫자로.
- specialTerms 는 요약하지 말고 원문 그대로(여러 항목이면 줄바꿈으로 구분) 담습니다.
- 설명 없이 JSON 객체 하나만 출력합니다.`;
