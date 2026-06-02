# T-03 하자 제보 — 임차인↔임대인 연결 및 `issues` 스키마 변경 안내

> 작성일: 2026-06-03 · 작성자: jh · 대상: 협업자(특히 기반/임대인 측 담당)
> 목적: `prisma db push` 로 적용될 `issues` 테이블 변경의 **내용 · 변화 · 이유**를 공유한다.

---

## 1. 한 줄 요약

임차인이 올린 하자 제보가 **해당 임대인의 수신함에 도달**하도록, 임차인 계약(`Lease`)과 임대인 건물(`Building`)을 **주소로 연결**하는 기능을 추가했다. 이를 위해 `issues` 테이블에 컬럼 2개 추가 + `buildingId` 를 nullable 로 완화하는 **db push 가 필요**하다.

---

## 2. 왜 필요했나 (배경)

머지(jg ↔ jh) 후 드러난 **모델 단절** 때문이다.

- **`Building`** (jg, 임대인 측): 임대인이 등록하는 건물. `ownerId` 로 임대인과 연결됨.
- **`Lease`** (jg, 임차인 측, T-01): 임차인이 등록하는 본인 임대차계약. `userId` 로 임차인과 연결되며, **`Building` 과는 아무 관계(FK)가 없다.**
- **`Issue`** (jh, T-03): 하자 제보. 임대인 수신함은 `issue.buildingId ∈ (내 건물 id들)` 로 조회한다.

즉 같은 "한 집"을 임대인은 `Building` 으로, 임차인은 `Lease` 로 **각자 따로 입력**하며 둘을 잇는 키가 없었다. 그 결과:

- 임차인이 하자를 제보해도 `buildingId` 를 채울 방법이 없어 **임대인 수신함에 절대 뜨지 않는** 상태였다.
- (선행 증상) 제보 화면의 건물 드롭다운이 임대인 전용 `/api/buildings` 를 보고 있어 임차인에겐 **목록 자체가 비어 있었다** → 이미 `Lease` 기준으로 수정함.

이 단절을 메우는 **최소 연결 고리**가 이번 변경이다.

---

## 3. 설계 — 주소 기반 연결

임차인 `Lease` 와 임대인 `Building` 의 자연 조인키는 **주소**뿐이라, 주소 정규화 매칭으로 연결한다.

```
임차인 제보(leaseId)
   └─ 서버가 Lease.address 를 정규화( 공백·대소문자 제거 )
        └─ 같은 정규화 주소를 가진 Building 검색
              ├─ 매칭됨 → issue.buildingId = building.id  → 임대인 수신함 노출 + 실시간 알림(emitToUser(ownerId))
              └─ 실패   → issue.buildingId = null          → 임차인 이력에는 보이되 임대인엔 비노출(미연결)
```

- 제보 시 클라이언트는 `buildingId` 가 아니라 **`leaseId`(임차인 본인 계약)** 를 보낸다. 서버가 본인 계약인지 검증 후 주소로 건물을 해결한다.
- `Issue.buildingAddress` 에 제보 대상 주소를 저장해 **임대인 수신함에서 어느 집인지** 보이게 했다.

### POC 한계 (협업자 인지 필요)
- 주소 **문자열 정규화 일치**에 의존한다. 양측이 주소를 다르게 입력하면(도로명 vs 지번, 오타 등) 매칭이 안 돼 미연결로 남는다.
- 주소만 맞으면 연결되므로 **실제 임대차 관계를 검증하지는 않는다.** 데모/PoC 범위의 단순화이며, 운영 단계에서는 초대코드·계약 대조 등 정식 연결 절차가 필요하다.

---

## 4. db push 로 적용되는 변경 (정확한 SQL)

`prisma migrate diff` 로 뽑은, 실제 적용될 SQL:

```sql
ALTER TABLE `issues`
  ADD COLUMN `buildingAddress` VARCHAR(191) NULL,
  ADD COLUMN `leaseId`         VARCHAR(191) NULL,
  MODIFY     `buildingId`      VARCHAR(191) NULL;
```

### 변경 요약

| 컬럼 | 변경 전 | 변경 후 | 용도 |
|---|---|---|---|
| `buildingId` | `NOT NULL` | **`NULL` 허용** | 주소 매칭 실패 시 미연결 제보를 저장하기 위함 |
| `leaseId` | (없음) | **신규, NULL** | 제보한 임차인 계약(Lease) 출처 |
| `buildingAddress` | (없음) | **신규, NULL** | 제보 대상 주소(표시·매칭 참고) |

### Prisma 스키마(모델) 변화

```prisma
model Issue {
  id                 String        @id @default(cuid())
  buildingId         String?       // (변경) NOT NULL → nullable
  leaseId            String?       // (신규)
  buildingAddress    String?       // (신규)
  tenantId           String
  category           IssueCategory
  description        String        @db.Text
  photos             Json?
  proposedRepairRate Int
  aiNeedsLandlord    Boolean       @default(false)
  status             IssueStatus   @default(reported)
  createdAt          DateTime      @default(now())

  @@index([buildingId])
  @@index([tenantId])
  @@map("issues")
}
```

---

## 5. 영향 범위 · 데이터 안전성

- **`issues` 테이블 1개만** 바뀐다. `users` · `buildings` · `tenants` · `leases` · `vacancies` 등 **다른 테이블/데이터는 전혀 건드리지 않는다.**
- **데이터 손실 없음**: 모두 컬럼 추가 + 제약 완화(NOT NULL → NULL). 기존 issue 행의 `buildingId` 값은 그대로 유지되고, 신규 컬럼 2개는 기존 행에서 `NULL`.
- 공유 RDS(`butler_POC`)라 **팀 전체에 반영**되지만, `issues` 는 jh 슬라이스에서 추가한 테이블이라 임대인 측(건물·임차인·공실) 기능과는 독립적이다.

---

## 6. 적용 방법 (각자 로컬에서)

스키마는 마이그레이션이 아니라 **db push** 방식이다.

```bash
cd server
npx prisma db push      # issues 테이블에 위 ALTER 적용 (공유 DB)
npx prisma generate     # Prisma Client 재생성 (server 가 떠 있으면 EPERM → 먼저 서버 종료)
```

> ⚠️ `prisma generate` 는 실행 중인 서버(tsx watch)가 엔진 DLL 을 점유하면 `EPERM` 으로 실패한다. **서버를 잠깐 멈춘 뒤** 실행할 것.
>
> ⚠️ db push 전에는, 새 스키마로 생성된 Prisma Client 가 없는 컬럼을 참조해 **하자(Issue) 기능 전체(제보/수신함/이력)가 런타임 에러**를 낸다. 반드시 db push 를 먼저 적용해야 한다. (그 외 기능은 영향 없음)

---

## 7. 관련 코드 변경 (참고)

- `server/prisma/schema.prisma` — `Issue` 모델(위 4·5절)
- `server/src/controllers/issue.controller.ts` — `resolveBuilding()`(주소 정규화 매칭) + `leaseId` 본인 검증, 응답에 `linked` 동봉
- `server/src/types/issue.ts` · `client/src/types/issue.ts` — `IssueReportInput` 을 `leaseId` 기반으로, `Issue` 에 `leaseId`·`buildingAddress` 추가, `buildingId` nullable
- `client/src/views/tenant/DefectReport.vue` — 건물 목록을 `Lease(/api/leases)` 에서 로드하고 `leaseId` 전송
- `client/src/views/landlord/IssueInbox.vue` — 제보 건물 주소 표시
