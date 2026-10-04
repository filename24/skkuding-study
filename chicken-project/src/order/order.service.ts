import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import { PrismaV8Service } from '../prisma/prisma-v8.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';

export { Order };

/**
 * 주문 관리 서비스(OrderService) - Prisma v7 & v8 동시 지원.
 */
@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly v8: PrismaV8Service,
  ) {}

  /**
   * [Prisma v7] 주문 생성 ($transaction 트랜잭션).
   */
  async createOrder(dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      let calculatedTotalPrice = 0;
      const preparedItems: { chickenId: number; quantity: number; price: number }[] = [];

      for (const item of dto.items) {
        const chicken = await tx.chicken.findUnique({
          where: { id: item.chickenId },
        });

        if (!chicken) {
          throw new NotFoundException(`ID ${item.chickenId}에 해당하는 치킨이 존재하지 않습니다.`);
        }

        if (chicken.stock < item.quantity) {
          throw new BadRequestException(
            `'${chicken.name}'의 재고가 부족합니다. (현재 재고: ${chicken.stock}개, 요청: ${item.quantity}개)`,
          );
        }

        await tx.chicken.update({
          where: { id: item.chickenId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        const itemTotal = chicken.price * item.quantity;
        calculatedTotalPrice += itemTotal;
        preparedItems.push({
          chickenId: chicken.id,
          quantity: item.quantity,
          price: chicken.price,
        });
      }

      const order = await tx.order.create({
        data: {
          customerId: dto.customerId,
          status: OrderStatus.COMPLETED,
          totalPrice: calculatedTotalPrice,
          items: {
            create: preparedItems,
          },
        },
        include: {
          items: {
            include: {
              chicken: true,
            },
          },
        },
      });

      return order;
    });
  }

  /**
   * [Prisma v7] id로 주문 상세 정보 조회 (findUniqueOrThrow + include).
   */
  async findById(id: number) {
    try {
      return await this.prisma.order.findUniqueOrThrow({
        where: { id },
        include: {
          items: {
            include: {
              chicken: true,
            },
          },
        },
      });
    } catch {
      throw new NotFoundException('해당 주문 정보가 존재하지 않습니다.');
    }
  }

  /**
   * [Prisma v8] id로 주문 상세 정보 조회 (where().include().all().firstOrThrow()).
   */
  async findByIdV8(id: number) {
    try {
      const order = await this.v8.orm.public.Order
        .where({ id })
        .include('items', (items: any) => items.include('chicken', (chicken: any) => chicken))
        .all()
        .firstOrThrow();

      return {
        version: 'Prisma ORM v8 (RC)',
        methodUsed: 'db.orm.public.Order.where({ id }).include().all().firstOrThrow()',
        order,
      };
    } catch {
      throw new NotFoundException('해당 주문 정보가 존재하지 않습니다.');
    }
  }

  /**
   * [학습용] N+1 문제를 의도적으로 재현하는 메서드.
   */
  async findAllNPlusOne(limit: number = 5) {
    const orders = await this.prisma.order.findMany({
      take: limit,
      orderBy: { id: 'asc' },
    });

    const combinedOrders = [];
    for (const order of orders) {
      const items = await this.prisma.orderItem.findMany({
        where: { orderId: order.id },
        include: { chicken: true },
      });
      combinedOrders.push({
        ...order,
        items,
      });
    }

    return {
      problem: 'N+1 Query Issue',
      totalQueriesExecuted: 1 + orders.length,
      explanation: `주문 조회 1회 + 주문별 상품 조회 ${orders.length}회 = 총 ${1 + orders.length}번 쿼리가 실행되었습니다.`,
      orders: combinedOrders,
    };
  }

  /**
   * [학습용] relationLoadStrategy ('join' vs 'query') 실습 메서드.
   */
  async findAllEfficient(strategy: 'join' | 'query' = 'join', limit: number = 5) {
    const orders = await this.prisma.order.findMany({
      take: limit,
      relationLoadStrategy: strategy,
      orderBy: { id: 'asc' },
      include: {
        items: {
          include: {
            chicken: true,
          },
        },
      },
    });

    return {
      strategy,
      description:
        strategy === 'join'
          ? 'DB 레벨에서 JOIN(LEFT JOIN / LATERAL)을 사용하여 단일 쿼리로 관계 데이터를 조합합니다.'
          : 'Order 쿼리와 OrderItem 쿼리를 별도로 보낸 뒤 애플리케이션에서 데이터를 조합합니다.',
      orders,
    };
  }

  /**
   * [Prisma v7] 주문 목록 페이지네이션 (Cursor vs Offset).
   */
  async findAll(query: QueryOrderDto) {
    const limit = query.limit ?? 10;
    const page = query.page ?? 1;
    const cursor = query.cursor;
    const strategy = query.strategy ?? 'join';

    if (cursor) {
      const orders = await this.prisma.order.findMany({
        take: limit,
        skip: 1,
        cursor: { id: cursor },
        relationLoadStrategy: strategy,
        orderBy: { id: 'asc' },
        include: {
          items: {
            include: {
              chicken: true,
            },
          },
        },
      });

      const nextCursor = orders.length > 0 ? orders[orders.length - 1].id : null;
      return {
        orders,
        nextCursor,
        paginationType: 'cursor',
        strategy,
        version: 'Prisma v7',
      };
    }

    const skip = (page - 1) * limit;
    const [orders, totalCount] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        relationLoadStrategy: strategy,
        orderBy: { id: 'asc' },
        include: {
          items: {
            include: {
              chicken: true,
            },
          },
        },
      }),
      this.prisma.order.count(),
    ]);

    return {
      orders,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      paginationType: 'offset',
      strategy,
      version: 'Prisma v7',
    };
  }

  /**
   * [Prisma v8] 주문 목록 조회 (db.orm.public.Order.offset().limit().include().all()).
   */
  async findAllV8(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const orders = await this.v8.orm.public.Order
      .offset(skip)
      .limit(limit)
      .include('items', (items: any) => items.include('chicken', (chicken: any) => chicken))
      .all();

    return {
      version: 'Prisma ORM v8 (RC)',
      methodUsed: 'db.orm.public.Order.offset().limit().include().all()',
      page,
      limit,
      orders,
    };
  }
}

