<!-- Created: 2026-06-03 20:40 -->
# 버그 수정 — 임차 건물 삭제 시 하자 제보 잔존 — 작업 보고서

- 작성일: 2026-06-03
- 작업자: StabAn-NRH
- 범위: Butler Tenant — Lease 삭제와 Issue(T-03) 정합

---

## 1. 증상

임차인이 임차 건물(`Lease`)을 삭제해도 하자 제보 내역(`DefectHistory`)이 사라지지 않았다.

## 2. 원인

- `Issue`는 `Lease`와 **DB 관계(FK cascade) 없이 `leaseId` 스칼라 값으로만** 연결된다(머지 시 침투 회피 목적의 설계).
- 게다가 임차인 제보 이력은 `leaseId`가 아니라 **`tenantId`(사용자)** 기준으로 조회한다.
- 따라서 Lease를 삭제해도 Issue 행이 남고, 이력 조회에 계속 노출됐다.

## 3. 수정

`leases.service.ts`의 `deleteLease`를 변경 — 소유 검증 후, 그 계약에서 제보한 하자를 **트랜잭션으로 함께 삭제**:

```ts
const lease = await prisma.lease.findFirst({ where: { id, userId }, select: { id: true } });
if (!lease) throw new HttpError(404, '임차 건물을 찾을 수 없습니다.');
await prisma.$transaction([
  prisma.issue.deleteMany({ where: { leaseId: id, tenantId: userId } }),
  prisma.lease.delete({ where: { id } }),
]);
```

- 제보 시 클라이언트(`DefectReport`)가 `leaseId`를 전송함을 확인 → `leaseId`로 안전하게 정리 가능.

## 4. 영향 / 고려사항

- 해당 Issue가 주소 매칭으로 임대인 하자 수신함(`IssueInbox`)에 연결돼 있었다면, 단일 `Issue` 행을 공유하므로 **임대인 수신함에서도 함께 사라진다.** 임차인이 계약을 내리며 제보를 철회하는 것으로 보아 합리적이라 판단해 삭제로 처리.
- 정책상 "임대인이 받은 제보는 보존" 이 필요하면, 삭제 대신 소프트 처리(이력에서만 숨김)로 전환 가능.

## 5. 주요 파일

- `server/services/leases.service.ts` — `deleteLease`

## 6. 검증

- 서버 빌드 통과. (서버 변경이므로 적용 시 dev 서버 재시작 필요)
