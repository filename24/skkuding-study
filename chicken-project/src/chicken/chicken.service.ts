import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateChickenDto, UpdateChickenDto, ChickenType } from './dto/create-chicken.dto';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 치킨집 한 곳의 정보를 담는 데이터 구조.
 *
 * DB를 배우기 전까지는 `chickens.json` 장부 파일에 이 형태로 저장합니다.
 */
export interface Chicken {
  /** 서버가 자동으로 부여하는 치킨집 번호. API에서 가게를 가리킬 때 씁니다. */
  id: number;
  name: string;
  type: ChickenType;
  price: number;
  address: string;
  phone: string;
}

/**
 * 주방장(ChickenService).
 *
 * 카운터(Controller)가 넘겨준 주문을 실제로 처리하고,
 * 재고 장부(`src/data/chickens.json`)를 읽고 쓰는 역할을 맡습니다.
 * "장부에 없는 가게입니다"처럼 데이터에 대한 오류는 여기서 예외로 알립니다.
 *
 * `@Injectable()` 데코레이터를 붙이면 NestJS가 이 클래스를 '주방장'으로 인식하여
 * 필요한 곳에 주입해 줍니다.
 */
@Injectable()
export class ChickenService {
  /** 재고 장부 파일 위치 */
  private filePath = path.resolve(process.cwd(), 'src/data/chickens.json');

  /**
   * 장부(파일)에서 현재 데이터를 읽어옵니다.
   *
   * @returns 장부에 등록된 치킨집 목록. 장부 파일이 없으면 빈 배열
   */
  private readData(): Chicken[] {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    const raw = fs.readFileSync(this.filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed.chickens || [];
  }

  /**
   * 변경된 내용을 장부(파일)에 저장합니다.
   *
   * @param chickens - 저장할 치킨집 전체 목록
   */
  private writeData(chickens: Chicken[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify({ chickens }, null, 2), 'utf-8');
  }

  /**
   * 전체 치킨집 목록을 조회합니다.
   *
   * @returns 치킨집 목록을 담은 객체
   */
  findAll(): { chickens: Chicken[] } {
    return { chickens: this.readData() };
  }

  /**
   * id로 특정 치킨집을 찾습니다.
   *
   * Pipe(`ParseIntPipe`)가 숫자 변환을, 여기서는 "장부에 있는 데이터인지"를 책임집니다.
   * 둘은 검사하는 문제가 다르기 때문에 따로 처리합니다.
   *
   * @param id - 찾으려는 치킨집 번호
   * @returns 해당 치킨집 정보
   * @throws NotFoundException 장부에 없는 id를 요청했을 때 (HTTP 404)
   */
  findById(id: number): Chicken {
    const chicken = this.readData().find((item) => item.id === id);
    if (!chicken) {
      throw new NotFoundException('해당 치킨집 정보가 존재하지 않습니다.');
    }
    return chicken;
  }

  /**
   * 상호명으로 특정 치킨집을 찾습니다.
   *
   * 신규 등록 시 상호가 겹치는지 확인할 때 씁니다.
   *
   * @param name - 찾으려는 치킨집 상호명
   * @returns 찾은 치킨집 정보, 없으면 `undefined`
   */
  findByName(name: string): Chicken | undefined {
    return this.readData().find((item) => item.name === name);
  }

  /**
   * 신규 치킨집을 등록합니다.
   *
   * @param dto - ValidationPipe 검사를 통과한 등록 주문서
   * @returns 서버가 id까지 채워서 돌려주는 새 치킨집 정보
   * @throws ConflictException 같은 상호의 치킨집이 이미 있을 때 (HTTP 409)
   */
  create(dto: CreateChickenDto): Chicken {
    const chickens = this.readData();
    if (chickens.some((item) => item.name === dto.name)) {
      throw new ConflictException('이미 해당 치킨집 정보가 존재합니다.');
    }

    const chicken: Chicken = { id: this.nextId(chickens), ...dto };
    chickens.push(chicken);
    this.writeData(chickens);
    return chicken;
  }

  /**
   * 치킨집 정보를 일부만 수정합니다.
   *
   * @param id - 수정할 치킨집 번호
   * @param dto - 바꿀 값만 담은 수정 주문서
   * @returns 수정된 치킨집 정보
   * @throws NotFoundException 장부에 없는 id를 요청했을 때 (HTTP 404)
   */
  update(id: number, dto: UpdateChickenDto): Chicken {
    const chickens = this.readData();
    const index = chickens.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException('해당 치킨집 정보가 존재하지 않습니다.');
    }

    chickens[index] = { ...chickens[index], ...dto };
    this.writeData(chickens);
    return chickens[index];
  }

  /**
   * 치킨집 정보를 삭제합니다.
   *
   * @param id - 삭제할 치킨집 번호
   * @returns 삭제된 치킨집 정보
   * @throws NotFoundException 장부에 없는 id를 요청했을 때 (HTTP 404)
   */
  delete(id: number): Chicken {
    const chickens = this.readData();
    const index = chickens.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new NotFoundException('해당 치킨집 정보가 존재하지 않습니다.');
    }

    const [deleted] = chickens.splice(index, 1);
    this.writeData(chickens);
    return deleted;
  }

  /**
   * 새 가게 번호를 만듭니다. 가장 큰 id에 1을 더한 값입니다.
   *
   * @param chickens - 현재 장부의 치킨집 목록
   * @returns 부여할 새 id
   */
  private nextId(chickens: Chicken[]): number {
    return chickens.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  }
}
