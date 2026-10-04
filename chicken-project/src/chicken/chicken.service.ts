import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Chicken, Prisma } from '@prisma/client';
import { PrismaV8Service } from '../prisma/prisma-v8.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BatchCreateChickenDto,
  CreateChickenDto,
  OccUpdateChickenDto,
  QueryChickenDto,
  UpdateChickenDto,
} from './dto/create-chicken.dto';

export { Chicken };

/**
 * 주방장(ChickenService) - Prisma ORM v7 & v8 동시 지원.
 *
 * 동일한 데이터베이스를 대상으로 v7과 v8의 API 문법을 나란히 구현하여
 * 실제로 호출하고 동작과 응답을 비교할 수 있도록 설계되었습니다.
 *
 * - findAll() (v7 findMany) vs findAllV8() (v8 db.orm.public.Chicken.all)
 * - findById() (v7 findUniqueOrThrow) vs findByIdV8() (v8 where().all().firstOrThrow)
 * - create() (v7 create with data wrapper) vs createV8() (v8 create without data wrapper)
 * - createBatch() (v7 createMany) vs createBatchV8() (v8 createAndCount onConflict: 'skip')
 */
@Injectable()
export class ChickenService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly v8: PrismaV8Service,
  ) {}

  // ==========================================
  // [조회: v7 findMany vs v8 all()]
  // ==========================================

  /**
   * [Prisma v7] 전체 치킨집 목록 조회
   */
  async findAll(query?: QueryChickenDto) {
    const limit = query?.limit ?? 10;
    const page = query?.page ?? 1;
    const cursor = query?.cursor;
    const projection = query?.projection ?? 'all';

    // 1. 프로젝션 설정 (select vs omit)
    let selectClause: Prisma.ChickenSelect | undefined;
    let omitClause: Prisma.ChickenOmit | undefined;

    if (projection === 'select') {
      selectClause = {
        id: true,
        name: true,
        price: true,
        spicyLevel: true,
      };
    } else if (projection === 'omit') {
      omitClause = {
        createdAt: true,
        updatedAt: true,
      };
    }

    // 2. 페이지네이션 방식 결정 (Cursor vs Offset)
    if (cursor) {
      const chickens = await this.prisma.chicken.findMany({
        take: limit,
        skip: 1,
        cursor: { id: cursor },
        orderBy: { id: 'asc' },
        ...(selectClause ? { select: selectClause } : {}),
        ...(omitClause ? { omit: omitClause } : {}),
      });

      const nextCursor = chickens.length > 0 ? (chickens[chickens.length - 1] as Chicken).id : null;
      return { chickens, nextCursor, paginationType: 'cursor', version: 'Prisma v7' };
    }

    const skip = (page - 1) * limit;
    const [chickens, totalCount] = await Promise.all([
      this.prisma.chicken.findMany({
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        ...(selectClause ? { select: selectClause } : {}),
        ...(omitClause ? { omit: omitClause } : {}),
      }),
      this.prisma.chicken.count(),
    ]);

    return {
      chickens,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      paginationType: 'offset',
      version: 'Prisma v7',
    };
  }

  /**
   * [Prisma v8] 전체 치킨집 목록 조회.
   *
   * v7의 prisma.chicken.findMany() 대신
   * v8에서는 db.orm.public.Chicken.offset().limit().all() 형태로 체이닝합니다.
   */
  async findAllV8(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const chickens = await this.v8.orm.public.Chicken.offset(skip).limit(limit).all();

    return {
      version: 'Prisma ORM v8 (RC)',
      methodUsed: 'db.orm.public.Chicken.offset().limit().all()',
      page,
      limit,
      chickens,
    };
  }

  // ==========================================
  // [단건 조회: v7 findUniqueOrThrow vs v8 firstOrThrow]
  // ==========================================

  /**
   * [Prisma v7] id로 치킨집 단건 조회 (findUniqueOrThrow).
   */
  async findById(id: number): Promise<Chicken> {
    try {
      return await this.prisma.chicken.findUniqueOrThrow({
        where: { id },
      });
    } catch {
      throw new NotFoundException('해당 치킨집 정보가 존재하지 않습니다.');
    }
  }

  /**
   * [Prisma v8] id로 치킨집 단건 조회 (where(...).all().firstOrThrow()).
   *
   * v7의 별도 메서드 findUniqueOrThrow() 대신,
   * v8에서는 where() 필터링 후 all().firstOrThrow() 파이프라인으로 일관되게 조회합니다.
   */
  async findByIdV8(id: number) {
    try {
      const chicken = await this.v8.orm.public.Chicken.where({ id }).all().firstOrThrow();

      return {
        version: 'Prisma ORM v8 (RC)',
        methodUsed: 'db.orm.public.Chicken.where({ id }).all().firstOrThrow()',
        chicken,
      };
    } catch {
      throw new NotFoundException('해당 치킨집 정보가 존재하지 않습니다.');
    }
  }

  /**
   * 상호명으로 특정 치킨집 조회
   */
  async findByName(name: string): Promise<Chicken | null> {
    return this.prisma.chicken.findUnique({
      where: { name },
    });
  }

  // ==========================================
  // [등록: v7 data 래퍼 vs v8 직관적 인자]
  // ==========================================

  /**
   * [Prisma v7] 신규 치킨집 등록.
   */
  async create(dto: CreateChickenDto): Promise<Chicken> {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('이미 해당 치킨집 정보가 존재합니다.');
    }

    return this.prisma.chicken.create({
      data: {
        name: dto.name,
        type: dto.type,
        price: dto.price,
        address: dto.address,
        phone: dto.phone,
        stock: dto.stock ?? 10,
        spicyLevel: dto.spicyLevel ?? 0,
      },
    });
  }

  /**
   * [Prisma v8] 신규 치킨집 등록.
   *
   * v7과 달리 { data: { ... } } 래퍼 프로퍼티가 제거되고,
   * 생성할 객체를 직접 인자로 넘깁니다: db.orm.public.Chicken.create(...)
   */
  async createV8(dto: CreateChickenDto) {
    const existing = await this.findByName(dto.name);
    if (existing) {
      throw new ConflictException('이미 해당 치킨집 정보가 존재합니다.');
    }

    const chicken = await this.v8.orm.public.Chicken.create({
      name: dto.name,
      type: dto.type,
      price: dto.price,
      address: dto.address,
      phone: dto.phone,
      stock: dto.stock ?? 10,
      spicyLevel: dto.spicyLevel ?? 0,
      updatedAt: new Date().toISOString().replace('T', ' ').replace('Z', ''),
    });

    return {
      version: 'Prisma ORM v8 (RC)',
      methodUsed: 'db.orm.public.Chicken.create(objectWithoutDataWrapper)',
      chicken,
    };
  }

  // ==========================================
  // [대량 등록: v7 createMany vs v8 createAll / createAndCount]
  // ==========================================

  /**
   * [Prisma v7] 대량 등록 (createMany + skipDuplicates: true)
   */
  async createBatch(dto: BatchCreateChickenDto): Promise<{ count: number; version: string }> {
    const data = dto.chickens.map((item) => ({
      name: item.name,
      type: item.type,
      price: item.price,
      address: item.address,
      phone: item.phone,
      stock: item.stock ?? 10,
      spicyLevel: item.spicyLevel ?? 0,
    }));

    const result = await this.prisma.chicken.createMany({
      data,
      skipDuplicates: true,
    });

    return {
      version: 'Prisma v7',
      count: result.count,
    };
  }

  /**
   * [Prisma v8] 대량 등록 (createAll & createAndCount with onConflict: 'skip')
   *
   * skipDuplicates: true는 v8의 onConflict: 'skip'으로 직관화되었으며,
   * 삽입된 개수는 createAndCount()로 즉시 반환받습니다.
   */
  async createBatchV8(dto: BatchCreateChickenDto) {
    const nowStr = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const data = dto.chickens.map((item) => ({
      name: item.name,
      type: item.type,
      price: item.price,
      address: item.address,
      phone: item.phone,
      stock: item.stock ?? 10,
      spicyLevel: item.spicyLevel ?? 0,
      updatedAt: nowStr,
    }));

    const insertedCount = await this.v8.orm.public.Chicken.createAndCount(data, {
      onConflict: 'skip',
      conflictOn: ['name'],
    });

    return {
      version: 'Prisma ORM v8 (RC)',
      methodUsed: "db.orm.public.Chicken.createAndCount(data, { onConflict: 'skip' })",
      insertedCount,
    };
  }

  // ==========================================
  // [수정 및 동시성 제어]
  // ==========================================

  async update(id: number, dto: UpdateChickenDto): Promise<Chicken> {
    try {
      return await this.prisma.chicken.update({
        where: { id },
        data: dto,
      });
    } catch {
      throw new NotFoundException('해당 치킨집 정보가 존재하지 않습니다.');
    }
  }

  async delete(id: number): Promise<Chicken> {
    try {
      return await this.prisma.chicken.delete({
        where: { id },
      });
    } catch {
      throw new NotFoundException('해당 치킨집 정보가 존재하지 않습니다.');
    }
  }

  async updateStockAtomic(id: number, quantity: number): Promise<Chicken> {
    try {
      return await this.prisma.chicken.update({
        where: { id },
        data: {
          stock: {
            decrement: quantity,
          },
        },
      });
    } catch {
      throw new NotFoundException('해당 치킨집 정보가 존재하지 않습니다.');
    }
  }

  async updateWithOCC(id: number, dto: OccUpdateChickenDto): Promise<Chicken> {
    const { version, ...updateData } = dto;

    const result = await this.prisma.chicken.updateMany({
      where: {
        id,
        version,
      },
      data: {
        ...updateData,
        version: {
          increment: 1,
        },
      },
    });

    if (result.count === 0) {
      throw new ConflictException(
        '동시 수정 충돌이 발생했습니다(버전 불일치 또는 데이터 미존재). 최신 데이터를 다시 조회 후 시도해주세요.',
      );
    }

    return this.findById(id);
  }
}
