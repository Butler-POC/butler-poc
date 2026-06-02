// 하자 스토어 (Pinia) — T-03 제보·이력 / 임대인 수신함
import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Issue, IssueReportInput } from '@/types';
import * as api from '@/api/issues';

export const useIssuesStore = defineStore('issues', () => {
  const mine = ref<Issue[]>([]); // 임차인 제보 이력
  const inbox = ref<Issue[]>([]); // 임대인 수신함
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function loadMine() {
    loading.value = true;
    error.value = null;
    try {
      mine.value = await api.fetchMyIssues();
    } catch {
      error.value = '하자 내역을 불러오지 못했습니다. 다시 시도해 주세요.';
    } finally {
      loading.value = false;
    }
  }

  async function loadInbox() {
    loading.value = true;
    error.value = null;
    try {
      inbox.value = await api.fetchLandlordIssues();
    } catch {
      error.value = '수신함을 불러오지 못했습니다. 다시 시도해 주세요.';
    } finally {
      loading.value = false;
    }
  }

  async function report(input: IssueReportInput): Promise<Issue | null> {
    loading.value = true;
    error.value = null;
    try {
      const created = await api.createIssue(input);
      mine.value = [created, ...mine.value];
      return created;
    } catch {
      error.value = '제보에 실패했습니다. 다시 시도해 주세요.';
      return null;
    } finally {
      loading.value = false;
    }
  }

  // 소켓 'issue:reported' 수신 시 임대인 수신함 상단에 반영 (실시간 도달)
  function prependIncoming(issue: Issue) {
    inbox.value = [issue, ...inbox.value.filter((i) => i.id !== issue.id)];
  }

  return { mine, inbox, loading, error, loadMine, loadInbox, report, prependIncoming };
});
