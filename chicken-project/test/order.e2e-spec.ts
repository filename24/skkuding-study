import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChickenType } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { API_KEY } from '../src/chicken/guards/api-key.guard';
import { PrismaService } from '../src/prisma/prisma.service';

describe('주문 API (e2e - v7 & v8)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let chickenId: number;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    // DB 데이터 초기화
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.chicken.deleteMany();

    // 테스트용 치킨 생성 (재고 5마리)
    const chicken = await prisma.chicken.create({
      data: {
        name: '맛있는치킨 율전점',
        type: ChickenType.FRIED,
        price: 20000,
        address: '수원시 율전동',
        phone: '031-111-2222',
        stock: 5,
        spicyLevel: 1,
      },
    });
    chickenId = chicken.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /order ($transaction 트랜잭션)', () => {
    it('재고가 충분하면 주문을 성공하고 재고가 차감된다', async () => {
      const response = await request(app.getHttpServer())
        .post('/order')
        .set('x-api-key', API_KEY)
        .send({
          customerId: 'customer-tester',
          items: [{ chickenId, quantity: 2 }],
        })
        .expect(201);

      expect(response.body.customerId).toBe('customer-tester');
      expect(response.body.totalPrice).toBe(40000);
      expect(response.body.items).toHaveLength(1);

      // 재고가 실제로 5 -> 3으로 줄었는지 DB 직접 확인
      const updatedChicken = await prisma.chicken.findUniqueOrThrow({
        where: { id: chickenId },
      });
      expect(updatedChicken.stock).toBe(3);
    });

    it('재고보다 많은 수량을 주문하면 400 에러를 반환하고 재고는 롤백된다', async () => {
      await request(app.getHttpServer())
        .post('/order')
        .set('x-api-key', API_KEY)
        .send({
          customerId: 'customer-tester',
          items: [{ chickenId, quantity: 10 }], // 5마리 남았는데 10마리 주문
        })
        .expect(400);

      // 롤백되어 재고가 여전히 5마리여야 함
      const chicken = await prisma.chicken.findUniqueOrThrow({
        where: { id: chickenId },
      });
      expect(chicken.stock).toBe(5);
    });
  });

  describe('GET /order/study/n-plus-one (N+1 문제 시뮬레이션)', () => {
    it('N+1 문제 분석 결과와 주문 목록을 200으로 반환한다', async () => {
      // 1건 주문 생성
      await request(app.getHttpServer())
        .post('/order')
        .set('x-api-key', API_KEY)
        .send({
          customerId: 'customer-n1',
          items: [{ chickenId, quantity: 1 }],
        });

      const response = await request(app.getHttpServer())
        .get('/order/study/n-plus-one?limit=5')
        .expect(200);

      expect(response.body).toHaveProperty('problem');
      expect(response.body.totalQueriesExecuted).toBeGreaterThanOrEqual(2);
      expect(response.body.orders).toHaveLength(1);
    });
  });

  describe('GET /order/study/strategy (relationLoadStrategy)', () => {
    it('join 전략으로 관계 데이터를 단일 쿼리로 조회한다', async () => {
      const response = await request(app.getHttpServer())
        .get('/order/study/strategy?strategy=join')
        .expect(200);

      expect(response.body.strategy).toBe('join');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });

    it('query 전략으로 분할 쿼리 조합 방식으로 조회한다', async () => {
      const response = await request(app.getHttpServer())
        .get('/order/study/strategy?strategy=query')
        .expect(200);

      expect(response.body.strategy).toBe('query');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });
  });

  describe('v8 endpoints (/order/v8 & /order/:id/v8)', () => {
    it('[v8] GET /order/v8로 v8 all() 조회 결과를 반환한다', async () => {
      // 1건 주문 생성
      await request(app.getHttpServer())
        .post('/order')
        .set('x-api-key', API_KEY)
        .send({
          customerId: 'customer-v8',
          items: [{ chickenId, quantity: 1 }],
        });

      const response = await request(app.getHttpServer())
        .get('/order/v8')
        .expect(200);

      expect(response.body.version).toBe('Prisma ORM v8 (RC)');
      expect(response.body.orders).toHaveLength(1);
    });

    it('[v8] GET /order/:id/v8로 v8 firstOrThrow() 상세 조회를 수행한다', async () => {
      const created = await request(app.getHttpServer())
        .post('/order')
        .set('x-api-key', API_KEY)
        .send({
          customerId: 'customer-v8-detail',
          items: [{ chickenId, quantity: 1 }],
        });

      const orderId = created.body.id;

      const response = await request(app.getHttpServer())
        .get(`/order/${orderId}/v8`)
        .expect(200);

      expect(response.body.version).toBe('Prisma ORM v8 (RC)');
      expect(response.body.order.customerId).toBe('customer-v8-detail');
    });
  });
});
