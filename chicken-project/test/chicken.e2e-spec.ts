import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChickenType } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { API_KEY } from '../src/chicken/guards/api-key.guard';
import { PrismaService } from '../src/prisma/prisma.service';

const SEED_CHICKENS = [
  {
    name: '성대통닭 율전본점',
    type: ChickenType.FRIED,
    price: 18000,
    address: '경기 수원시 장안구 율전로108번길 11',
    phone: '031-290-0001',
    stock: 15,
    version: 0,
    spicyLevel: 0,
  },
  {
    name: '황금올리브 율전역점',
    type: ChickenType.SEASONED,
    price: 20000,
    address: '경기 수원시 장안구 서부로 2100',
    phone: '031-290-0002',
    stock: 10,
    version: 0,
    spicyLevel: 2,
  },
];

const NEW_CHICKEN = {
  name: 'BBQ 비타민점',
  type: 'HONEY',
  price: 22000,
  address: '경기 수원시 영통구 매탄로 42',
  phone: '031-290-0004',
  stock: 12,
  spicyLevel: 1,
};

describe('치킨집 API (e2e - v7 & v8)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let firstChickenId: number;

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
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.chicken.deleteMany();

    const created = await prisma.chicken.create({ data: SEED_CHICKENS[0] });
    firstChickenId = created.id;
    await prisma.chicken.create({ data: SEED_CHICKENS[1] });
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /chicken (v7 vs v8)', () => {
    it('[v7] 전체 치킨집 목록을 200으로 응답한다', async () => {
      const response = await request(app.getHttpServer()).get('/chicken').expect(200);

      expect(response.body.chickens).toHaveLength(2);
      expect(response.body.totalCount).toBe(2);
    });

    it('[v7] select 프로젝션 모드로 요청 시 지정된 필드만 반환한다', async () => {
      const response = await request(app.getHttpServer())
        .get('/chicken?projection=select')
        .expect(200);

      expect(response.body.chickens[0]).toHaveProperty('name');
      expect(response.body.chickens[0]).toHaveProperty('spicyLevel');
      expect(response.body.chickens[0]).not.toHaveProperty('address');
    });

    it('[v7] cursor 페이지네이션으로 다음 데이터를 조회한다', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chicken?cursor=${firstChickenId}&limit=1`)
        .expect(200);

      expect(response.body.paginationType).toBe('cursor');
      expect(response.body.chickens).toHaveLength(1);
    });

    it('[v8] GET /chicken/v8로 v8 all() 조회 결과를 반환한다', async () => {
      const response = await request(app.getHttpServer()).get('/chicken/v8').expect(200);

      expect(response.body.version).toBe('Prisma ORM v8 (RC)');
      expect(response.body.chickens).toHaveLength(2);
    });
  });

  describe('POST /chicken (v7 vs v8)', () => {
    it('API Key가 없으면 403으로 거절한다', async () => {
      await request(app.getHttpServer()).post('/chicken').send(NEW_CHICKEN).expect(403);
    });

    it('API Key가 틀리면 403으로 거절한다', async () => {
      await request(app.getHttpServer())
        .post('/chicken')
        .set('x-api-key', 'wrong-key')
        .send(NEW_CHICKEN)
        .expect(403);
    });

    it('양식에 맞지 않는 Body는 ValidationPipe가 400으로 거절한다', async () => {
      const response = await request(app.getHttpServer())
        .post('/chicken')
        .set('x-api-key', API_KEY)
        .send({ name: '', address: 123, phone: null, type: 'SPICY', price: 'abc' })
        .expect(400);

      expect(Array.isArray(response.body.message)).toBe(true);
    });

    it('[v7] 올바른 주문서면 201로 등록하고 서버가 id를 붙인다', async () => {
      const response = await request(app.getHttpServer())
        .post('/chicken')
        .set('x-api-key', API_KEY)
        .send({ ...NEW_CHICKEN, id: 999 })
        .expect(201);

      expect(response.body.name).toBe(NEW_CHICKEN.name);
      expect(typeof response.body.id).toBe('number');
    });

    it('[v8] POST /chicken/v8로 data 래퍼 없이 직접 등록한다', async () => {
      const response = await request(app.getHttpServer())
        .post('/chicken/v8')
        .set('x-api-key', API_KEY)
        .send(NEW_CHICKEN)
        .expect(201);

      expect(response.body.version).toBe('Prisma ORM v8 (RC)');
      expect(response.body.chicken.name).toBe(NEW_CHICKEN.name);
    });

    it('같은 상호를 다시 등록하면 ConflictException으로 409를 응답한다', async () => {
      await request(app.getHttpServer())
        .post('/chicken')
        .set('x-api-key', API_KEY)
        .send(NEW_CHICKEN)
        .expect(201);

      await request(app.getHttpServer())
        .post('/chicken')
        .set('x-api-key', API_KEY)
        .send(NEW_CHICKEN)
        .expect(409);
    });
  });

  describe('POST /chicken/batch (v7 vs v8)', () => {
    const batchData = {
      chickens: [
        {
          name: '교촌치킨 매탄점',
          type: ChickenType.SOY,
          price: 21000,
          address: '경기 수원시 영통구 매탄로 10',
          phone: '031-290-0010',
          stock: 10,
          spicyLevel: 0,
        },
        {
          name: '처갓집양념 율전점',
          type: ChickenType.SEASONED,
          price: 19000,
          address: '경기 수원시 장안구 율전로 20',
          phone: '031-290-0011',
          stock: 10,
          spicyLevel: 1,
        },
      ],
    };

    it('[v7] POST /chicken/batch로 여러 치킨집을 한 번에 등록한다 (createMany)', async () => {
      const response = await request(app.getHttpServer())
        .post('/chicken/batch')
        .set('x-api-key', API_KEY)
        .send(batchData)
        .expect(201);

      expect(response.body.count).toBe(2);
      expect(response.body.version).toBe('Prisma v7');
    });

    it('[v8] POST /chicken/batch/v8로 v8 createAndCount를 실행한다', async () => {
      const response = await request(app.getHttpServer())
        .post('/chicken/batch/v8')
        .set('x-api-key', API_KEY)
        .send(batchData)
        .expect(201);

      expect(response.body.version).toBe('Prisma ORM v8 (RC)');
      expect(response.body.insertedCount).toBe(2);
    });
  });

  describe('GET /chicken/:id (v7 vs v8)', () => {
    it('숫자가 아닌 id는 ParseIntPipe가 400으로 거절한다', async () => {
      await request(app.getHttpServer()).get('/chicken/chicken').expect(400);
    });

    it('[v7] 존재하는 id는 200으로 응답한다 (findUniqueOrThrow)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chicken/${firstChickenId}`)
        .expect(200);

      expect(response.body.name).toBe(SEED_CHICKENS[0].name);
    });

    it('[v8] GET /chicken/:id/v8로 firstOrThrow() 조회를 수행한다', async () => {
      const response = await request(app.getHttpServer())
        .get(`/chicken/${firstChickenId}/v8`)
        .expect(200);

      expect(response.body.version).toBe('Prisma ORM v8 (RC)');
      expect(response.body.chicken.name).toBe(SEED_CHICKENS[0].name);
    });

    it('[v8] 존재하지 않는 id로 /chicken/:id/v8 조회 시 404를 반환한다', async () => {
      await request(app.getHttpServer()).get('/chicken/999999/v8').expect(404);
    });
  });

  describe('PATCH /chicken/:id/stock (Atomic Update)', () => {
    it('원자적으로 재고를 차감한다', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/chicken/${firstChickenId}/stock`)
        .set('x-api-key', API_KEY)
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body.stock).toBe(10);
    });
  });

  describe('PATCH /chicken/:id/occ (Optimistic Concurrency Control)', () => {
    it('버전이 일치하면 수정을 성공하고 버전을 1 증가시킨다', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/chicken/${firstChickenId}/occ`)
        .set('x-api-key', API_KEY)
        .send({ version: 0, price: 19500 })
        .expect(200);

      expect(response.body.price).toBe(19500);
      expect(response.body.version).toBe(1);
    });

    it('버전이 다르면 충돌(409 Conflict)을 반환한다', async () => {
      await request(app.getHttpServer())
        .patch(`/chicken/${firstChickenId}/occ`)
        .set('x-api-key', API_KEY)
        .send({ version: 99, price: 19500 })
        .expect(409);
    });
  });

  describe('DELETE /chicken/:id', () => {
    it('치킨집을 삭제하면 200 응답 후 조회 시 404가 된다', async () => {
      await request(app.getHttpServer())
        .delete(`/chicken/${firstChickenId}`)
        .set('x-api-key', API_KEY)
        .expect(200);

      await request(app.getHttpServer()).get(`/chicken/${firstChickenId}`).expect(404);
    });
  });
});
