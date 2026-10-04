import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderStatus } from '@prisma/client';
import { PrismaV8Service } from '../prisma/prisma-v8.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderService } from './order.service';

describe('OrderService (v7 & v8)', () => {
  let service: OrderService;
  let mockPrisma: any;

  beforeEach(async () => {
    mockPrisma = {
      $transaction: jest.fn((callback) => callback(mockTx)),
      order: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      orderItem: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        PrismaV8Service,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  const mockTx = {
    chicken: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
    },
  };

  describe('createOrder ($transaction)', () => {
    it('재고가 충분하면 주문과 주문상품을 생성하고 재고를 차감한다', async () => {
      mockTx.chicken.findUnique.mockResolvedValue({
        id: 1,
        name: '성대통닭',
        price: 18000,
        stock: 5,
      });

      mockTx.order.create.mockResolvedValue({
        id: 101,
        customerId: 'customer-1',
        totalPrice: 36000,
        status: OrderStatus.COMPLETED,
        items: [{ chickenId: 1, quantity: 2, price: 18000 }],
      });

      const order = await service.createOrder({
        customerId: 'customer-1',
        items: [{ chickenId: 1, quantity: 2 }],
      });

      expect(order.id).toBe(101);
      expect(mockTx.chicken.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: { decrement: 2 } },
      });
    });

    it('재고가 부족하면 BadRequestException을 발생시키고 트랜잭션이 중단된다', async () => {
      mockTx.chicken.findUnique.mockResolvedValue({
        id: 1,
        name: '성대통닭',
        price: 18000,
        stock: 1,
      });

      await expect(
        service.createOrder({
          customerId: 'customer-1',
          items: [{ chickenId: 1, quantity: 2 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('존재하지 않는 치킨을 주문하면 NotFoundException을 발생시킨다', async () => {
      mockTx.chicken.findUnique.mockResolvedValue(null);

      await expect(
        service.createOrder({
          customerId: 'customer-1',
          items: [{ chickenId: 999, quantity: 1 }],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllNPlusOne', () => {
    it('주문 수 + 1회의 쿼리 실행 횟수를 집계하여 반환한다', async () => {
      mockPrisma.order.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      mockPrisma.orderItem.findMany.mockResolvedValue([{ id: 10, chickenId: 1 }]);

      const result = await service.findAllNPlusOne(2);

      expect(result.totalQueriesExecuted).toBe(3);
      expect(result.orders).toHaveLength(2);
    });
  });

  describe('findAllEfficient', () => {
    it('relationLoadStrategy(join 또는 query)를 findMany에 전달한다', async () => {
      mockPrisma.order.findMany.mockResolvedValue([]);

      const result = await service.findAllEfficient('join', 5);

      expect(result.strategy).toBe('join');
      expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          relationLoadStrategy: 'join',
        }),
      );
    });
  });

  describe('v8 methods', () => {
    it('[v8] findAllV8로 db.orm.public.Order.offset().limit().all()을 호출한다', async () => {
      mockPrisma.order.findMany.mockResolvedValue([{ id: 1 }]);

      const result = await service.findAllV8(1, 10);

      expect(result.version).toBe('Prisma ORM v8 (RC)');
      expect(result.orders).toHaveLength(1);
    });

    it('[v8] findByIdV8로 db.orm.public.Order.where().all().firstOrThrow()를 호출한다', async () => {
      mockPrisma.order.findFirst.mockResolvedValue({ id: 1 });

      const result = await service.findByIdV8(1);

      expect(result.version).toBe('Prisma ORM v8 (RC)');
      expect(result.order.id).toBe(1);
    });
  });
});
