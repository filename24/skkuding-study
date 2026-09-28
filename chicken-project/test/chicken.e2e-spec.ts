import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as request from 'supertest';
import { setupApp } from '../src/app.setup';
import { ChickenModule } from '../src/chicken/chicken.module';
import { Chicken, ChickenService } from '../src/chicken/chicken.service';
import { API_KEY } from '../src/chicken/guards/api-key.guard';

/** e2e 테스트가 실제 장부(src/data/chickens.json)를 건드리지 않도록 임시 장부를 씁니다. */
const SEED_CHICKENS: Chicken[] = [
  {
    id: 1,
    name: '성대통닭 율전본점',
    type: 'FRIED' as Chicken['type'],
    price: 18000,
    address: '경기 수원시 장안구 율전로108번길 11',
    phone: '031-290-0001',
  },
  {
    id: 2,
    name: '황금올리브 율전역점',
    type: 'SEASONED' as Chicken['type'],
    price: 20000,
    address: '경기 수원시 장안구 서부로 2100',
    phone: '031-290-0002',
  },
];

/** 정상적인 신규 등록 주문서 */
const NEW_CHICKEN = {
  name: 'BBQ 비타민점',
  type: 'HONEY',
  price: 22000,
  address: '경기 수원시 영통구 매탄로 42',
  phone: '031-290-0004',
};

describe('치킨집 API (e2e)', () => {
  let app: INestApplication;
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chicken-e2e-'));
    const dataFile = path.join(tmpDir, 'chickens.json');
    fs.writeFileSync(dataFile, JSON.stringify({ chickens: SEED_CHICKENS }, null, 2), 'utf-8');

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [ChickenModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app); // 실제 서버(main.ts)와 같은 전역 설정(ValidationPipe 등)을 적용합니다.

    // 주방장이 임시 장부를 쓰도록 바꿔서, 테스트가 원본 chickens.json을 덮어쓰지 않게 합니다.
    const service = app.get(ChickenService);
    (service as unknown as { filePath: string }).filePath = dataFile;

    await app.init();
  });

  afterEach(async () => {
    await app.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('GET /chicken', () => {
    it('전체 치킨집 목록을 200으로 응답한다', async () => {
      const response = await request(app.getHttpServer()).get('/chicken').expect(200);

      expect(response.body.chickens).toHaveLength(2);
    });
  });

  describe('POST /chicken', () => {
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

    it('올바른 주문서면 201로 등록하고 서버가 id를 붙인다', async () => {
      const response = await request(app.getHttpServer())
        .post('/chicken')
        .set('x-api-key', API_KEY)
        .send({ ...NEW_CHICKEN, id: 999 })
        .expect(201);

      // whitelist: true 덕분에 손님이 끼워 넣은 id는 잘려 나가고 서버가 준 id가 담깁니다.
      expect(response.body.id).toBe(3);
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

  describe('GET /chicken/:id', () => {
    it('숫자가 아닌 id는 ParseIntPipe가 400으로 거절한다', async () => {
      await request(app.getHttpServer()).get('/chicken/chicken').expect(400);
    });

    it('존재하지 않는 id는 NotFoundException으로 404를 응답한다', async () => {
      await request(app.getHttpServer()).get('/chicken/999').expect(404);
    });

    it('존재하는 id는 해당 치킨집을 200으로 응답한다', async () => {
      const response = await request(app.getHttpServer()).get('/chicken/1').expect(200);

      expect(response.body.name).toBe(SEED_CHICKENS[0].name);
    });
  });

  describe('PATCH /chicken/:id', () => {
    it('API Key가 없으면 403으로 거절한다', async () => {
      await request(app.getHttpServer()).patch('/chicken/1').send({ price: 19000 }).expect(403);
    });

    it('바꿀 값만 담아 200으로 수정한다', async () => {
      const response = await request(app.getHttpServer())
        .patch('/chicken/1')
        .set('x-api-key', API_KEY)
        .send({ price: 19000 })
        .expect(200);

      expect(response.body.price).toBe(19000);
      expect(response.body.name).toBe(SEED_CHICKENS[0].name);
    });

    it('존재하지 않는 id를 수정하면 404를 응답한다', async () => {
      await request(app.getHttpServer())
        .patch('/chicken/999')
        .set('x-api-key', API_KEY)
        .send({ price: 19000 })
        .expect(404);
    });
  });

  describe('DELETE /chicken/:id', () => {
    it('API Key가 없으면 403으로 거절한다', async () => {
      await request(app.getHttpServer()).delete('/chicken/1').expect(403);
    });

    it('삭제한 뒤에는 404가 된다', async () => {
      await request(app.getHttpServer())
        .delete('/chicken/1')
        .set('x-api-key', API_KEY)
        .expect(200);

      await request(app.getHttpServer()).get('/chicken/1').expect(404);
    });
  });
});
