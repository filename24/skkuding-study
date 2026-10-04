/**
 * # Day 4 스터디: Prisma ORM v7 vs Prisma ORM v8(RC) 문법 및 아키텍처 비교
 *
 * 2026년 10월 기준, Prisma ORM 8은 Release Candidate 단계입니다.
 * 이번 스터디에서는 v8을 바닥부터 다시 배우기보다는,
 * 실무에서 v7으로 작성된 코드가 v8에서 어떤 패러다임과 문법으로 변화했는지를
 * 한눈에 비교할 수 있도록 정리했습니다.
 *
 * | 주제 | Prisma v7 (현재 프로젝트) | Prisma v8 (차세대 RC) |
 * | --- | --- | --- |
 * | **스키마 파일** | `prisma/schema.prisma` | `prisma/contract.prisma` |
 * | **스키마 블록** | `datasource`, `generator` 명시 | 오직 모델 정의만 (설정은 `prisma.config.ts`) |
 * | **클라이언트 생성** | `pnpm prisma generate` | `pnpm prisma contract emit` |
 * | **모델 접근** | `prisma.chicken` | `db.orm.public.Chicken` |
 * | **단건 조회 실패** | `findUniqueOrThrow()` | `.where(...).all().firstOrThrow()` |
 * | **대량 생성** | `createMany({ skipDuplicates: true })` | `createAll(..., { onConflict: 'skip' })` |
 * | **삽입 개수 카운트** | `createMany()`의 반환값 `{ count }` | `createAndCount()` |
 * | **Raw SQL** | `$queryRaw`, `$executeRaw` | SQL builder + runtime API 분리 |
 * | **PostgreSQL Enum** | `enum ChickenType` (DB enum 타입 생성) | `native_enum` + `pg.enum()` (기본 enum은 text 저장) |
 * | **마이그레이션 워크플로우** | `migrate dev` / `migrate deploy` | `migration plan` -> `db migrate` |
 */

import { PrismaClient } from '@prisma/client';

/**
 * 1. 모델 접근 및 전체 조회 (findMany vs all)
 */
export async function compareFindAll(prisma: PrismaClient) {
  // [v7 방식]
  // 직관적인 모델명(소문자)과 findMany 메서드
  const v7_chickens = await prisma.chicken.findMany();

  // [v8 방식 가상 코드]
  // 스키마 네임스페이스(public)와 파이프라인 형태의 all() 호출
  // const v8_chickens = await db.orm.public.Chicken.all();

  return { v7_chickens };
}

/**
 * 2. 단건 조회 및 예외 처리 (findUniqueOrThrow vs firstOrThrow)
 */
export async function compareFindUniqueOrThrow(prisma: PrismaClient, chickenId: number) {
  // [v7 방식]
  // 데이터가 없을 때 P2025 NotFound 에러를 던지며, 반환 타입이 non-nullable
  const v7_chicken = await prisma.chicken.findUniqueOrThrow({
    where: { id: chickenId },
  });

  // [v8 방식 가상 코드]
  // 별도의 findUniqueOrThrow 대신 where -> all -> firstOrThrow 파이프라인 구조
  // const v8_chicken = await db.orm.public.Chicken
  //   .where({ id: chickenId })
  //   .all()
  //   .firstOrThrow();

  return { v7_chicken };
}

/**
 * 3. 대량 삽입 및 충돌 처리 (createMany vs createAll / createAndCount)
 */
export async function compareCreateMany(
  prisma: PrismaClient,
  chickens: Array<{ name: string; price: number; address: string; phone: string }>,
) {
  // [v7 방식]
  // skipDuplicates: true 옵션을 사용해 unique 제약 충돌 무시
  const v7_result = await prisma.chicken.createMany({
    data: chickens.map((c) => ({ ...c, type: 'FRIED' as const })),
    skipDuplicates: true,
  });

  // [v8 방식 가상 코드]
  // onConflict: 'skip'으로 직관화되었으며, 특정 unique 컬럼만 지정(conflictOn) 가능
  // await db.orm.public.Chicken.createAll(chickens, {
  //   onConflict: 'skip',
  //   conflictOn: ['name'],
  // });
  //
  // 삽입된 row 수가 필요한 경우:
  // const insertedCount = await db.orm.public.Chicken.createAndCount(chickens, {
  //   onConflict: 'skip',
  // });

  return { v7_insertedCount: v7_result.count };
}

/**
 * 4. Raw SQL 쿼리 구조 변화 ($queryRaw vs SQL builder)
 */
export async function compareRawSql(prisma: PrismaClient) {
  // [v7 방식]
  // 태그드 템플릿 리터럴로 파라미터 바인딩과 SQL 실행을 동시에 수행
  const v7_rows = await prisma.$queryRaw<Array<{ id: number; name: string }>>`
    SELECT id, name FROM "Chicken" WHERE price >= 20000
  `;

  // [v8 방식 가상 코드]
  // SQL 빌더와 런타임 실행 엔진이 완전히 분리되어 타입 안정성과 재사용성 극대화
  // const query = sql`SELECT id, name FROM ${Chicken} WHERE price >= ${20000}`;
  // const v8_rows = await db.execute(query);

  return { v7_rows };
}

/**
 * 5. 스키마 정의 및 마이그레이션 워크플로우 비교 가이드
 */
export const MIGRATION_WORKFLOW_COMPARISON = {
  v7: {
    schemaFile: 'prisma/schema.prisma',
    generateCommand: 'pnpm prisma generate',
    devMigration: 'pnpm prisma migrate dev --name <migration_name>',
    deployMigration: 'pnpm prisma migrate deploy',
    statusCheck: 'pnpm prisma migrate status',
    workflow: 'schema.prisma 수정 -> migrate dev (마이그레이션 생성 + dev DB 적용 + shadow DB 검증) -> git commit -> 배포 시 migrate deploy',
  },
  v8: {
    schemaFile: 'prisma/contract.prisma (datasource/generator 블록 제거)',
    generateCommand: 'pnpm prisma contract emit (contract.json 및 contract.d.ts 생성)',
    devMigration: 'pnpm prisma migration plan -> pnpm prisma db migrate --advance-ref db',
    deployMigration: 'pnpm prisma db migrate',
    workflow: 'contract.prisma 수정 -> contract emit -> migration plan (변경 계획 수립) -> migration review -> db migrate 적용',
  },
};
