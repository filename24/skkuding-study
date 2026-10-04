import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChickenType } from '@prisma/client';
import { PrismaV8Service } from '../prisma/prisma-v8.service';
import { PrismaService } from '../prisma/prisma.service';
import { Chicken, ChickenService } from './chicken.service';
import { CreateChickenDto } from './dto/create-chicken.dto';

const MOCK_CHICKENS: Chicken[] = [
  {
    id: 1,
    name: '성대통닭 율전본점',
    type: ChickenType.FRIED,
    price: 18000,
    address: '경기 수원시 장안구 율전로108번길 11',
    phone: '031-290-0001',
    stock: 15,
    version: 0,
    spicyLevel: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: '황금올리브 율전역점',
    type: ChickenType.SEASONED,
    price: 20000,
    address: '경기 수원시 장안구 서부로 2100',
    phone: '031-290-0002',
    stock: 10,
    version: 0,
    spicyLevel: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const NEW_CHICKEN: CreateChickenDto = {
  name: 'BBQ 비타민점',
  type: ChickenType.HONEY,
  price: 22000,
  address: '경기 수원시 영통구 매탄로 42',
  phone: '031-290-0004',
  stock: 12,
  spicyLevel: 0,
};

describe('ChickenService (v7 & v8)', () => {
  let service: ChickenService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      chicken: {
        findMany: jest.fn().mockResolvedValue(MOCK_CHICKENS),
        findFirst: jest.fn(),
        count: jest.fn().mockResolvedValue(MOCK_CHICKENS.length),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 2 }),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChickenService,
        PrismaV8Service,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ChickenService>(ChickenService);
  });

  describe('findAll (v7 vs v8)', () => {
    it('[v7] 치킨집 목록과 페이징 정보를 반환한다 (Offset)', async () => {
      const result = await service.findAll();

      expect(result.chickens).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.paginationType).toBe('offset');
      expect(result.version).toBe('Prisma v7');
    });

    it('[v7] cursor가 주어지면 Cursor 페이지네이션을 수행한다', async () => {
      mockPrisma.chicken.findMany.mockResolvedValue([MOCK_CHICKENS[1]]);

      const result = await service.findAll({ cursor: 1, limit: 1 });

      expect(result.paginationType).toBe('cursor');
      expect(result.chickens).toHaveLength(1);
      expect(result.nextCursor).toBe(2);
    });

    it('[v8] findAllV8로 db.orm.public.Chicken.offset().limit().all()을 호출한다', async () => {
      const result = await service.findAllV8(1, 10);

      expect(result.version).toBe('Prisma ORM v8 (RC)');
      expect(result.chickens).toHaveLength(2);
      expect(mockPrisma.chicken.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { id: 'asc' },
      });
    });
  });

  describe('findById (v7 vs v8)', () => {
    it('[v7] findUniqueOrThrow를 호출하고 결과를 반환한다', async () => {
      mockPrisma.chicken.findUniqueOrThrow.mockResolvedValue(MOCK_CHICKENS[0]);

      const chicken = await service.findById(1);

      expect(chicken).toEqual(MOCK_CHICKENS[0]);
      expect(mockPrisma.chicken.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('[v7] 존재하지 않는 id로 조회 시 NotFoundException을 발생시킨다', async () => {
      mockPrisma.chicken.findUniqueOrThrow.mockRejectedValue(new Error('Record not found'));

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });

    it('[v8] findByIdV8로 where().all().firstOrThrow()를 호출하고 결과를 반환한다', async () => {
      mockPrisma.chicken.findFirst.mockResolvedValue(MOCK_CHICKENS[0]);

      const result = await service.findByIdV8(1);

      expect(result.version).toBe('Prisma ORM v8 (RC)');
      expect(result.chicken).toEqual(MOCK_CHICKENS[0]);
    });

    it('[v8] 존재하지 않는 id로 조회 시 RUNTIME.NO_ROWS(404) 에러를 발생시킨다', async () => {
      mockPrisma.chicken.findFirst.mockResolvedValue(null);

      await expect(service.findByIdV8(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create (v7 vs v8)', () => {
    it('[v7] 새 치킨집을 data 래퍼로 등록한다', async () => {
      mockPrisma.chicken.findUnique.mockResolvedValue(null);
      mockPrisma.chicken.create.mockResolvedValue({ id: 3, ...NEW_CHICKEN });

      const result = await service.create(NEW_CHICKEN);

      expect(result.id).toBe(3);
      expect(mockPrisma.chicken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: NEW_CHICKEN.name }),
      });
    });

    it('[v8] createV8로 data 래퍼 없이 직접 객체를 전달하여 등록한다', async () => {
      mockPrisma.chicken.findUnique.mockResolvedValue(null);
      mockPrisma.chicken.create.mockResolvedValue({ id: 3, ...NEW_CHICKEN });

      const result = await service.createV8(NEW_CHICKEN);

      expect(result.version).toBe('Prisma ORM v8 (RC)');
      expect(result.chicken.id).toBe(3);
    });
  });

  describe('createBatch (v7 vs v8)', () => {
    it('[v7] createMany({ skipDuplicates: true })를 호출한다', async () => {
      const result = await service.createBatch({ chickens: [NEW_CHICKEN] });

      expect(result.version).toBe('Prisma v7');
      expect(result.count).toBe(2);
      expect(mockPrisma.chicken.createMany).toHaveBeenCalledWith({
        data: expect.any(Array),
        skipDuplicates: true,
      });
    });

    it('[v8] createBatchV8로 createAndCount({ onConflict: "skip" })를 호출한다', async () => {
      const result = await service.createBatchV8({ chickens: [NEW_CHICKEN] });

      expect(result.version).toBe('Prisma ORM v8 (RC)');
      expect(result.insertedCount).toBe(2);
    });
  });

  describe('updateStockAtomic', () => {
    it('원자적으로 재고 수량을 차감한다', async () => {
      mockPrisma.chicken.update.mockResolvedValue({
        ...MOCK_CHICKENS[0],
        stock: 13,
      });

      const updated = await service.updateStockAtomic(1, 2);

      expect(updated.stock).toBe(13);
      expect(mockPrisma.chicken.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          stock: {
            decrement: 2,
          },
        },
      });
    });
  });

  describe('updateWithOCC', () => {
    it('버전이 일치하면 수정을 반영하고 버전을 증가시킨다', async () => {
      mockPrisma.chicken.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.chicken.findUniqueOrThrow.mockResolvedValue({
        ...MOCK_CHICKENS[0],
        price: 19000,
        version: 1,
      });

      const updated = await service.updateWithOCC(1, { version: 0, price: 19000 });

      expect(updated.price).toBe(19000);
      expect(updated.version).toBe(1);
    });

    it('버전이 일치하지 않아 updateCount가 0이면 ConflictException을 발생시킨다', async () => {
      mockPrisma.chicken.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updateWithOCC(1, { version: 99, price: 19000 }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
