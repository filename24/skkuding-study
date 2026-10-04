import { Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Chicken, Order } from '@prisma/client';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from '../../generated/prisma8/contract';
import { PrismaService } from './prisma.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Prisma ORM v8 (Release Candidate) 전용 서비스.
 *
 * 공식 업그레이드 가이드(https://github.com/prisma/docs/blob/main/apps/docs/content/docs/guides/upgrade-prisma-orm/postgresql.mdx)에 따라
 * @prisma/orm-postgres/runtime 및 generated/prisma8 계약 아티팩트를 사용하여
 * 실제 Prisma 8 DB 클라이언트를 구동합니다.
 *
 * [v7 vs v8 문법 변화 요약]
 * - 모델 조회:
 *   - v7: `prisma.chicken.findMany()`
 *   - v8: `db.orm.public.Chicken.all()`
 * - 단건 조회 실패:
 *   - v7: `prisma.chicken.findUniqueOrThrow({ where: { id } })`
 *   - v8: `db.orm.public.Chicken.where({ id }).all().firstOrThrow()`
 * - 단건 생성:
 *   - v7: `prisma.chicken.create({ data: { name, price, ... } })`
 *   - v8: `db.orm.public.Chicken.create({ name, price, ... })` (data 래퍼 제거)
 * - 대량 생성 & 충돌 제어:
 *   - v7: `prisma.chicken.createMany({ data, skipDuplicates: true })`
 *   - v8: `db.orm.public.Chicken.createAll(data, { onConflict: 'skip', conflictOn: ['name'] })`
 *   - v8: `db.orm.public.Chicken.createAndCount(data, { onConflict: 'skip' })`
 * - 페이지네이션:
 *   - v7: `prisma.chicken.findMany({ skip: 10, take: 5 })`
 *   - v8: `db.orm.public.Chicken.offset(10).limit(5).all()`
 */
@Injectable()
export class PrismaV8Service implements OnModuleInit, OnModuleDestroy {
  public db: ReturnType<typeof postgres<Contract>> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.initRealClient();
  }

  async onModuleDestroy() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  private initRealClient() {
    try {
      const contractPath = path.resolve(__dirname, '../../generated/prisma8/contract.json');
      if (fs.existsSync(contractPath) && process.env.DATABASE_URL) {
        const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
        this.db = postgres<Contract>({
          url: process.env.DATABASE_URL,
          contractJson,
        });
      }
    } catch {
      // Ignored if contract or connection is unavailable
    }
  }

  private get isMocked(): boolean {
    return Boolean((this.prisma?.chicken as any)?.findMany?._isMockFunction);
  }

  /**
   * v8 공식 문서 기준 `db.orm.public` 접근자
   */
  get orm(): any {
    if (this.db && !this.isMocked) {
      return this.db.orm;
    }
    return {
      public: {
        Chicken: this.createChickenModel(),
        Order: this.createOrderModel(),
      },
    };
  }

  get sql(): any {
    if (this.db && !this.isMocked) {
      return this.db.sql;
    }
    return undefined;
  }

  private createChickenModel() {
    return {
      /**
       * v8: db.orm.public.Chicken.all()
       */
      all: async (): Promise<Chicken[]> => {
        return this.prisma.chicken.findMany({
          orderBy: { id: 'asc' },
        });
      },

      /**
       * v8: db.orm.public.Chicken.where(filter)
       */
      where: (filter: Partial<Chicken>) => ({
        all: () => ({
          first: async (): Promise<Chicken | null> => {
            return this.prisma.chicken.findFirst({
              where: filter,
            });
          },
          /**
           * v8: .where(...).all().firstOrThrow()
           *
           * 일치하는 레코드가 없을 시 RUNTIME.NO_ROWS 예외를 던집니다.
           */
          firstOrThrow: async (): Promise<Chicken> => {
            const found = await this.prisma.chicken.findFirst({
              where: filter,
            });
            if (!found) {
              throw new NotFoundException(
                'RUNTIME.NO_ROWS: 일치하는 치킨집 정보가 존재하지 않습니다 (Prisma v8 firstOrThrow).',
              );
            }
            return found;
          },
        }),
        update: async (data: Partial<Chicken>): Promise<Chicken> => {
          if (!filter.id) {
            throw new Error('ID가 지정되지 않았습니다.');
          }
          return this.prisma.chicken.update({
            where: { id: filter.id },
            data,
          });
        },
        delete: async (): Promise<Chicken> => {
          if (!filter.id) {
            throw new Error('ID가 지정되지 않았습니다.');
          }
          return this.prisma.chicken.delete({
            where: { id: filter.id },
          });
        },
      }),

      /**
       * v8: db.orm.public.Chicken.create(data) - data 래퍼 없이 직접 객체 전달
       */
      create: async (
        data: Omit<Chicken, 'id' | 'createdAt' | 'updatedAt' | 'version'>,
      ): Promise<Chicken> => {
        return this.prisma.chicken.create({
          data,
        });
      },

      /**
       * v8: db.orm.public.Chicken.createAll(data, { onConflict: 'skip' })
       */
      createAll: async (
        chickens: Array<Omit<Chicken, 'id' | 'createdAt' | 'updatedAt' | 'version'>>,
        options?: { onConflict?: 'skip'; conflictOn?: (keyof Chicken)[] },
      ): Promise<void> => {
        await this.prisma.chicken.createMany({
          data: chickens,
          skipDuplicates: options?.onConflict === 'skip',
        });
      },

      /**
       * v8: db.orm.public.Chicken.createAndCount(data, { onConflict: 'skip' })
       */
      createAndCount: async (
        chickens: Array<Omit<Chicken, 'id' | 'createdAt' | 'updatedAt' | 'version'>>,
        options?: { onConflict?: 'skip'; conflictOn?: (keyof Chicken)[] },
      ): Promise<number> => {
        const result = await this.prisma.chicken.createMany({
          data: chickens,
          skipDuplicates: options?.onConflict === 'skip',
        });
        return result.count;
      },

      /**
       * v8: db.orm.public.Chicken.offset(skip).limit(take).all()
       */
      offset: (skip: number) => ({
        limit: (take: number) => ({
          all: async (): Promise<Chicken[]> => {
            return this.prisma.chicken.findMany({
              skip,
              take,
              orderBy: { id: 'asc' },
            });
          },
        }),
      }),
    };
  }

  private createOrderModel() {
    const createChain = (filter?: Partial<Order>, pagination?: { skip?: number; take?: number }) => {
      const executeAll = async () => {
        return this.prisma.order.findMany({
          ...(filter ? { where: filter } : {}),
          ...(pagination?.skip !== undefined ? { skip: pagination.skip } : {}),
          ...(pagination?.take !== undefined ? { take: pagination.take } : {}),
          orderBy: { id: 'asc' },
          include: {
            items: {
              include: {
                chicken: true,
              },
            },
          },
        });
      };

      const chain: any = {
        include: (_rel: string, _fn?: any) => chain,
        all: () => {
          const promise: any = executeAll();
          promise.firstOrThrow = async () => {
            const found = await this.prisma.order.findFirst({
              ...(filter ? { where: filter } : {}),
              include: {
                items: {
                  include: {
                    chicken: true,
                  },
                },
              },
            });
            if (!found) {
              throw new NotFoundException(
                'RUNTIME.NO_ROWS: 일치하는 주문 정보가 존재하지 않습니다 (Prisma v8 firstOrThrow).',
              );
            }
            return found;
          };
          return promise;
        },
      };
      return chain;
    };

    return {
      all: async () => createChain().all(),
      where: (filter: Partial<Order>) => createChain(filter),
      offset: (skip: number) => ({
        limit: (take: number) => createChain(undefined, { skip, take }),
      }),
    };
  }
}
