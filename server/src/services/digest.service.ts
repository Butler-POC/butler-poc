// Created: 2026-06-03
// 임대인 메인화면 "오늘의 전달사항" — 전 건물·세입자·공실을 종합해 4종 전달사항을 계산한다.
//
// 전달사항 종류(우선순위 1→4):
//   1 RENT_DUE            오늘 월세를 납부해야 하는 세입자
//   2 LEASE_EXPIRING      계약 만료까지 1개월 이내인 세입자(남은 일수 표시)
//   3 OVERDUE             월세 연체자(연체개월·연체금액)
//   4 VACANT_UNREGISTERED 만료로 공실이 됐으나 공실 등록/묵시적 갱신 안 한 세대
//
// 정렬: 우선순위 asc → 최초 충족일(firstSeen) asc → 건물/세대/세입자 이름 asc
// 삭제(dismiss): 영구 숨김(due/exp/vac) vs 당일 한정(od — 다음날 재노출)
import { prisma } from '../lib/prisma';
import { HttpError } from '../middleware/error';

export type NoticeType =
  | 'RENT_DUE'
  | 'LEASE_EXPIRING'
  | 'OVERDUE'
  | 'VACANT_UNREGISTERED';

export interface Notice {
  key: string;
  type: NoticeType;
  priority: 1 | 2 | 3 | 4;
  firstSeen: string; // YYYY-MM-DD — 정렬용 "조건이 처음 충족된 날"
  sortName: string; // 동순위 2차 정렬 키(건물/세대/세입자)

  tenantId: string;
  buildingId: string;
  buildingName: string | null;
  address: string;
  unit: string | null;
  tenantName: string;

  // 타입별 표시 데이터
  monthlyRent?: number | null; // RENT_DUE
  dueDay?: number | null; // RENT_DUE — 납부일
  daysUntil?: number; // LEASE_EXPIRING — 만료까지 남은 일수
  leaseEnd?: string; // LEASE_EXPIRING / VACANT
  overdueMonths?: number; // OVERDUE
  overdueAmount?: number; // OVERDUE — overdueMonths * monthlyRent

  dismissible: boolean; // 사용자가 삭제 가능 여부(전부 true)
  canImplicitRenew?: boolean; // VACANT — 묵시적 갱신 처리 가능
  canRegisterVacancy?: boolean; // VACANT — 공실 등록 화면으로 이동
}

/* ───────────────────────── 날짜 유틸 ───────────────────────── */

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** 날짜만 갖는 Date (로컬 자정) */
function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function ym(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function daysInMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

/** "YYYY-MM-DD"·"YYYY.MM.DD"·"YYYY년 MM월 DD일" 등 관대한 파서 → 날짜Date | null */
function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = String(s).match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(y, mo - 1, d);
}

/** 두 날짜 사이 일수(b - a, 날짜 기준) */
function daysBetween(a: Date, b: Date): number {
  return Math.round((dateOnly(b).getTime() - dateOnly(a).getTime()) / 86400000);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}

/** "YYYY-MM" 두 값의 개월 차 (to - from) */
function monthDiffYm(from: string, to: string): number {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

/** 오늘과 납부일 기준 "이번에 내야 할 달"(YYYY-MM) */
function currentDueMonth(paymentDay: number | null, today: Date): string {
  const pd = Math.min(31, Math.max(1, paymentDay ?? 1));
  let y = today.getFullYear();
  let m = today.getMonth(); // 0-based
  if (today.getDate() < pd) {
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
  }
  return `${y}-${pad2(m + 1)}`;
}

/* ───────────────────────── 전달사항 계산 ───────────────────────── */

type TenantRow = {
  id: string;
  name: string;
  unit: string | null;
  monthlyRent: number | null;
  paymentDay: number | null;
  lastPaidMonth: string | null;
  leaseEnd: string | null;
  renewedImplicitly: boolean;
};

type BuildingRow = {
  id: string;
  buildingName: string | null;
  address: string;
  tenants: TenantRow[];
  vacancies: { unit: string | null }[];
};

function normUnit(u: string | null): string {
  return (u ?? '').replace(/\s+/g, '').toLowerCase();
}

/** 한 세입자에 대해 발생 가능한 전달사항(0~N건)을 만든다. (테스트를 위해 export) */
export function noticesForTenant(
  t: TenantRow,
  b: BuildingRow,
  today: Date,
  vacancyUnits: Set<string>,
): Notice[] {
  const out: Notice[] = [];
  const base = {
    tenantId: t.id,
    buildingId: b.id,
    buildingName: b.buildingName,
    address: b.address,
    unit: t.unit,
    tenantName: t.name,
  };
  const sortName = `${b.buildingName ?? b.address}${t.unit ?? ''}${t.name}`;

  const hasRent = (t.monthlyRent ?? 0) > 0 && t.paymentDay != null;
  const thisYm = ym(today);

  /* ── #1 RENT_DUE — 오늘이 납부일이고 이번 달 미납 ── */
  let dueToday = false;
  if (hasRent) {
    const dim = daysInMonth(today.getFullYear(), today.getMonth() + 1);
    const pd = Math.min(t.paymentDay as number, dim); // 말일 클램핑(31일 납부·30일 달 → 30일)
    if (today.getDate() === pd && t.lastPaidMonth !== thisYm) {
      dueToday = true;
      out.push({
        ...base,
        key: `due:${t.id}:${thisYm}`,
        type: 'RENT_DUE',
        priority: 1,
        firstSeen: ymd(today),
        sortName,
        monthlyRent: t.monthlyRent,
        dueDay: t.paymentDay,
        dismissible: true,
      });
    }
  }

  /* ── #3 OVERDUE — 지난 달(들) 미납. 오늘 납부일이면 이번 달 몫은 연체로 치지 않음 ── */
  if (hasRent && t.lastPaidMonth) {
    const due = currentDueMonth(t.paymentDay, today);
    let missed = monthDiffYm(t.lastPaidMonth, due);
    if (dueToday) missed -= 1; // 오늘이 납부일 → 이번 달은 #1 로 처리, 연체에서 제외
    if (missed > 0) {
      // 최초 연체일 = 마지막 납부월 다음 달의 납부일
      const [ly, lm] = t.lastPaidMonth.split('-').map(Number);
      const ny = lm === 12 ? ly + 1 : ly;
      const nm = lm === 12 ? 1 : lm + 1;
      const fd = Math.min(t.paymentDay as number, daysInMonth(ny, nm));
      out.push({
        ...base,
        key: `od:${t.id}`,
        type: 'OVERDUE',
        priority: 3,
        firstSeen: ymd(new Date(ny, nm - 1, fd)),
        sortName,
        overdueMonths: missed,
        overdueAmount: missed * (t.monthlyRent as number),
        monthlyRent: t.monthlyRent,
        dismissible: true,
      });
    }
  }

  /* ── 계약기간 관련(#2·#4) — 묵시적 갱신이면 전달하지 않음 ── */
  if (!t.renewedImplicitly) {
    const end = parseDate(t.leaseEnd);
    if (end) {
      const today0 = dateOnly(today);
      const end0 = dateOnly(end);
      const windowOpen = addMonths(today0, 1);
      if (end0 >= today0 && end0 <= windowOpen) {
        /* #2 LEASE_EXPIRING — 만료까지 1개월 이내 */
        out.push({
          ...base,
          key: `exp:${t.id}:${ymd(end0)}`,
          type: 'LEASE_EXPIRING',
          priority: 2,
          firstSeen: ymd(addMonths(end0, -1)), // 1개월 창이 열린 날
          sortName,
          daysUntil: daysBetween(today0, end0),
          leaseEnd: t.leaseEnd ?? undefined,
          dismissible: true,
        });
      } else if (end0 < today0) {
        /* #4 VACANT_UNREGISTERED — 만료로 공실, 공실 미등록 & 묵시갱신 아님 */
        const registered = vacancyUnits.has(normUnit(t.unit));
        if (!registered) {
          out.push({
            ...base,
            key: `vac:${t.id}:${ymd(end0)}`,
            type: 'VACANT_UNREGISTERED',
            priority: 4,
            firstSeen: ymd(end0),
            sortName,
            leaseEnd: t.leaseEnd ?? undefined,
            dismissible: true,
            canImplicitRenew: true,
            canRegisterVacancy: true,
          });
        }
      }
    }
  }

  return out;
}

/** 임대인의 오늘 전달사항 목록(정렬·삭제필터 적용) */
export async function buildDigest(ownerId: string): Promise<Notice[]> {
  const today = new Date();
  const todayStr = ymd(today);

  const buildings = (await prisma.building.findMany({
    where: { ownerId },
    select: {
      id: true,
      buildingName: true,
      address: true,
      tenants: {
        select: {
          id: true,
          name: true,
          unit: true,
          monthlyRent: true,
          paymentDay: true,
          lastPaidMonth: true,
          leaseEnd: true,
          renewedImplicitly: true,
        },
      },
      vacancies: { select: { unit: true } },
    },
  })) as BuildingRow[];

  // 후보 전달사항 수집
  const all: Notice[] = [];
  for (const b of buildings) {
    const vacancyUnits = new Set(b.vacancies.map((v) => normUnit(v.unit)));
    for (const t of b.tenants) {
      all.push(...noticesForTenant(t, b, today, vacancyUnits));
    }
  }

  // 삭제 기록 조회 후 필터
  const dismissals = await prisma.digestDismissal.findMany({
    where: { ownerId, noticeKey: { in: all.map((n) => n.key) } },
    select: { noticeKey: true, dismissedOn: true },
  });
  const dismissedMap = new Map(dismissals.map((d) => [d.noticeKey, d.dismissedOn]));

  const visible = all.filter((n) => {
    const on = dismissedMap.get(n.key);
    if (on === undefined) return true;
    // 연체(od:)는 당일만 숨김 → 다음날 재노출. 그 외는 영구 숨김.
    if (n.type === 'OVERDUE') return on !== todayStr;
    return false;
  });

  // 정렬: 우선순위 → 최초충족일 → 이름
  visible.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.firstSeen !== b.firstSeen) return a.firstSeen < b.firstSeen ? -1 : 1;
    return a.sortName < b.sortName ? -1 : a.sortName > b.sortName ? 1 : 0;
  });

  return visible;
}

/** 전달사항 삭제(dismiss) — noticeKey 기준 upsert(오늘 날짜 기록) */
export async function dismissNotice(ownerId: string, noticeKey: string) {
  const todayStr = ymd(new Date());
  await prisma.digestDismissal.upsert({
    where: { ownerId_noticeKey: { ownerId, noticeKey } },
    create: { ownerId, noticeKey, dismissedOn: todayStr },
    update: { dismissedOn: todayStr },
  });
}

/** 묵시적 갱신 처리 — 소유 건물의 세입자만. 이후 계약기간 전달사항(만료임박·공실) 중단 */
export async function markImplicitRenew(ownerId: string, tenantId: string) {
  const result = await prisma.tenant.updateMany({
    where: { id: tenantId, building: { ownerId } },
    data: { renewedImplicitly: true },
  });
  if (result.count === 0) throw new HttpError(404, '세입자를 찾을 수 없습니다.');
}

/* ═══════════════════════ 임차인 메인화면 전달사항 ═══════════════════════ */
//
// 종류(우선순위):
//   1 OVERDUE        월세 연체(연체개월·연체금액·마지막 납부월)
//   2 RENT_DUE       오늘이 월세 납부일
//   3 LEASE_EXPIRING 계약 만료까지 6~1개월 — 단계별 안내
//        · NOTIFY(6~2개월)           : 퇴거 예정이면 임대인에게 통지해야 함
//        · RENEWAL_IMMINENT(2~1개월) : 묵시적 갱신 임박
//
// 정렬: 우선순위 → 최초충족일 → 건물이름
// 삭제: 임대인과 동일(연체=당일한정, 그 외=영구·월세납부는 월단위)

export type TenantNoticeType = 'OVERDUE' | 'RENT_DUE' | 'LEASE_EXPIRING';
export type LeaseExpiryPhase = 'NOTIFY' | 'RENEWAL_IMMINENT';

export interface TenantNotice {
  key: string;
  type: TenantNoticeType;
  priority: 1 | 2 | 3;
  firstSeen: string;
  sortName: string;

  leaseId: string;
  buildingName: string | null;
  address: string;
  unit: string | null;
  lessorName: string | null;

  monthlyRent?: number | null;
  dueDay?: number | null; // RENT_DUE
  overdueMonths?: number; // OVERDUE
  overdueAmount?: number; // OVERDUE
  lastPaidMonth?: string | null; // OVERDUE
  daysUntil?: number; // LEASE_EXPIRING
  leaseEnd?: string; // LEASE_EXPIRING
  phase?: LeaseExpiryPhase; // LEASE_EXPIRING

  dismissible: boolean;
}

type LeaseRow = {
  id: string;
  address: string;
  buildingName: string | null;
  unit: string | null;
  lessorName: string | null;
  monthlyRent: number | null;
  paymentDay: number | null;
  lastPaidMonth: string | null;
  leaseEnd: string | null;
};

export function noticesForLease(l: LeaseRow, today: Date): TenantNotice[] {
  const out: TenantNotice[] = [];
  const base = {
    leaseId: l.id,
    buildingName: l.buildingName,
    address: l.address,
    unit: l.unit,
    lessorName: l.lessorName,
  };
  const sortName = `${l.buildingName ?? l.address}${l.unit ?? ''}`;
  const hasRent = (l.monthlyRent ?? 0) > 0 && l.paymentDay != null;
  const thisYm = ym(today);

  /* RENT_DUE — 오늘이 납부일 & 이번 달 미납 */
  let dueToday = false;
  if (hasRent) {
    const dim = daysInMonth(today.getFullYear(), today.getMonth() + 1);
    const pd = Math.min(l.paymentDay as number, dim);
    if (today.getDate() === pd && l.lastPaidMonth !== thisYm) {
      dueToday = true;
      out.push({
        ...base,
        key: `due:${l.id}:${thisYm}`,
        type: 'RENT_DUE',
        priority: 2,
        firstSeen: ymd(today),
        sortName,
        monthlyRent: l.monthlyRent,
        dueDay: l.paymentDay,
        dismissible: true,
      });
    }
  }

  /* OVERDUE — 지난 달(들) 미납 */
  if (hasRent && l.lastPaidMonth) {
    const due = currentDueMonth(l.paymentDay, today);
    let missed = monthDiffYm(l.lastPaidMonth, due);
    if (dueToday) missed -= 1;
    if (missed > 0) {
      const [ly, lm] = l.lastPaidMonth.split('-').map(Number);
      const ny = lm === 12 ? ly + 1 : ly;
      const nm = lm === 12 ? 1 : lm + 1;
      const fd = Math.min(l.paymentDay as number, daysInMonth(ny, nm));
      out.push({
        ...base,
        key: `od:${l.id}`,
        type: 'OVERDUE',
        priority: 1,
        firstSeen: ymd(new Date(ny, nm - 1, fd)),
        sortName,
        overdueMonths: missed,
        overdueAmount: missed * (l.monthlyRent as number),
        monthlyRent: l.monthlyRent,
        lastPaidMonth: l.lastPaidMonth,
        dismissible: true,
      });
    }
  }

  /* LEASE_EXPIRING — 만료까지 6~1개월 */
  const end = parseDate(l.leaseEnd);
  if (end) {
    const today0 = dateOnly(today);
    const end0 = dateOnly(end);
    const m1 = addMonths(today0, 1);
    const m2 = addMonths(today0, 2);
    const m6 = addMonths(today0, 6);
    if (end0 >= m1 && end0 <= m6) {
      const phase: LeaseExpiryPhase = end0 >= m2 ? 'NOTIFY' : 'RENEWAL_IMMINENT';
      out.push({
        ...base,
        key: `exp:${l.id}:${ymd(end0)}:${phase}`,
        type: 'LEASE_EXPIRING',
        priority: 3,
        firstSeen: ymd(addMonths(end0, -6)),
        sortName,
        daysUntil: daysBetween(today0, end0),
        leaseEnd: l.leaseEnd ?? undefined,
        phase,
        dismissible: true,
      });
    }
  }

  return out;
}

/** 임차인의 오늘 전달사항 목록(정렬·삭제필터 적용) */
export async function buildTenantDigest(userId: string): Promise<TenantNotice[]> {
  const today = new Date();
  const todayStr = ymd(today);

  const leases = (await prisma.lease.findMany({
    where: { userId },
    select: {
      id: true,
      address: true,
      buildingName: true,
      unit: true,
      lessorName: true,
      monthlyRent: true,
      paymentDay: true,
      lastPaidMonth: true,
      leaseEnd: true,
    },
  })) as LeaseRow[];

  const all: TenantNotice[] = [];
  for (const l of leases) all.push(...noticesForLease(l, today));

  const dismissals = await prisma.digestDismissal.findMany({
    where: { ownerId: userId, noticeKey: { in: all.map((n) => n.key) } },
    select: { noticeKey: true, dismissedOn: true },
  });
  const dismissedMap = new Map(dismissals.map((d) => [d.noticeKey, d.dismissedOn]));

  const visible = all.filter((n) => {
    const on = dismissedMap.get(n.key);
    if (on === undefined) return true;
    if (n.type === 'OVERDUE') return on !== todayStr; // 당일만 숨김
    return false; // 영구 숨김
  });

  visible.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    if (a.firstSeen !== b.firstSeen) return a.firstSeen < b.firstSeen ? -1 : 1;
    return a.sortName < b.sortName ? -1 : a.sortName > b.sortName ? 1 : 0;
  });

  return visible;
}
