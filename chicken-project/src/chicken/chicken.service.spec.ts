import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Chicken, ChickenService } from './chicken.service';
import { ChickenType, CreateChickenDto } from './dto/create-chicken.dto';

/** 테스트마다 새로 심는 장부 데이터 */
const SEED_CHICKENS: Chicken[] = [
  {
    id: 1,
    name: '성대통닭 율전본점',
    type: ChickenType.FRIED,
    price: 18000,
    address: '경기 수원시 장안구 율전로108번길 11',
    phone: '031-290-0001',
  },
  {
    id: 2,
    name: '황금올리브 율전역점',
    type: ChickenType.SEASONED,
    price: 20000,
    address: '경기 수원시 장안구 서부로 2100',
    phone: '031-290-0002',
  },
];

/** 새 치킨집 등록에 쓰는 유효한 주문서 */
const NEW_CHICKEN: CreateChickenDto = {
  name: 'BBQ 비타민점',
  type: ChickenType.HONEY,
  price: 22000,
  address: '경기 수원시 영통구 매탄로 42',
  phone: '031-290-0004',
};

/**
 * 주방장이 다른 장부 파일(임시 파일)을 쓰도록 바꿉니다.
 *
 * 주방장은 `src/data/chickens.json`을 직접 읽고 쓰기 때문에,
 * 테스트가 실제 장부를 건드리지 않도록 매 테스트마다 임시 파일을 가리키게 합니다.
 *
 * @param service - 장부 위치를 바꿀 주방장 인스턴스
 * @param filePath - 대신 사용할 장부 파일 경로
 */
function useTempDataFile(service: ChickenService, filePath: string): void {
  (service as unknown as { filePath: string }).filePath = filePath;
}

/** 임시 장부에 초기 데이터를 심습니다. */
function seedChickens(filePath: string, chickens: Chicken[]): void {
  fs.writeFileSync(filePath, JSON.stringify({ chickens }, null, 2), 'utf-8');
}

describe('ChickenService', () => {
  let service: ChickenService;
  let tmpDir: string;
  let dataFile: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chicken-service-'));
    dataFile = path.join(tmpDir, 'chickens.json');

    // NestJS 테스트 모듈로 주방장(Provider)만 독립적으로 띄웁니다.
    // 컨트롤러나 HTTP 요청 없이 주방장 혼자 동작하는지만 검증합니다(= Unit Test).
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChickenService],
    }).compile();

    service = module.get<ChickenService>(ChickenService);
    useTempDataFile(service, dataFile);
    seedChickens(dataFile, SEED_CHICKENS);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('findAll', () => {
    it('장부에 있는 치킨집 목록 전체를 반환한다', () => {
      const result = service.findAll();

      expect(Array.isArray(result.chickens)).toBe(true);
      expect(result.chickens).toHaveLength(2);
      expect(result.chickens[0]).toEqual(SEED_CHICKENS[0]);
    });
  });

  describe('findById', () => {
    it('id로 치킨집을 찾는다', () => {
      expect(service.findById(2)).toEqual(SEED_CHICKENS[1]);
    });

    it('존재하지 않는 id로 조회하면 NotFoundException을 발생시킨다', () => {
      expect(() => service.findById(999)).toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('새 치킨집을 등록하고 서버가 id를 자동으로 붙인다', () => {
      const created = service.create(NEW_CHICKEN);

      expect(created).toEqual({ id: 3, ...NEW_CHICKEN });
      expect(service.findAll().chickens).toHaveLength(3);
    });

    it('같은 상호의 치킨집을 등록하면 ConflictException을 발생시킨다', () => {
      expect(() => service.create(NEW_CHICKEN)).not.toThrow();

      expect(() => service.create(NEW_CHICKEN)).toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('보낸 필드만 골라서 수정한다', () => {
      const updated = service.update(1, { price: 19000 });

      expect(updated.price).toBe(19000);
      expect(updated.name).toBe(SEED_CHICKENS[0].name);
      expect(updated.phone).toBe(SEED_CHICKENS[0].phone);
    });

    it('존재하지 않는 id를 수정하면 NotFoundException을 발생시킨다', () => {
      expect(() => service.update(999, { price: 19000 })).toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('치킨집을 삭제하고 삭제된 정보를 반환한다', () => {
      const deleted = service.delete(1);

      expect(deleted).toEqual(SEED_CHICKENS[0]);
      expect(service.findAll().chickens).toHaveLength(1);
    });

    it('존재하지 않는 id를 삭제하면 NotFoundException을 발생시킨다', () => {
      expect(() => service.delete(999)).toThrow(NotFoundException);
    });
  });
});
