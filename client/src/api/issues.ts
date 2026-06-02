// 하자 API 래퍼 (T-02 상담 / T-03 제보·조회)
// './client' axios 인스턴스(baseURL '/api') 의 named export api 사용
import { api as http } from './client';
import type { Issue, IssueReportInput, RepairRateAssessment } from '@/types';

// T-03 — 하자 제보
export function createIssue(input: IssueReportInput): Promise<Issue> {
  return http.post<Issue>('/issues', input).then((r) => r.data);
}

// 임차인 본인 제보 이력
export function fetchMyIssues(): Promise<Issue[]> {
  return http.get<Issue[]>('/issues', { params: { mine: true } }).then((r) => r.data);
}

// 임대인 수신함 (내 건물 하자)
export function fetchLandlordIssues(): Promise<Issue[]> {
  return http.get<Issue[]>('/issues').then((r) => r.data);
}

// T-02 — 하자 상담 (상담 응답 + 수선비율 판정)
export interface RepairChatResult {
  reply: string;
  assessment: RepairRateAssessment;
  disclaimer: string;
}
export function repairChat(payload: {
  message: string;
  category?: string;
  description?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}): Promise<RepairChatResult> {
  return http.post<RepairChatResult>('/chat', { mode: 'repair', ...payload }).then((r) => r.data);
}
