import { Injectable } from '@nestjs/common';
import { CreateChickenDto, UpdateChickenDto, ChickenType } from './dto/create-chicken.dto';
import * as fs from 'fs';
import * as path from 'path';

export interface Chicken {
  name: string;
  type: ChickenType;
  price: number;
  address: string;
  phone: string;
}

// @Injectable() 데코레이터를 붙이면 NestJS가 이 클래스를 '주방장'으로 인식하여 필요한 곳에 주입해 줍니다.
@Injectable()
export class ChickenService {
  // 장부 파일 위치 지정
  private filePath = path.resolve(process.cwd(), 'src/data/chickens.json');

  // 장부(파일)에서 현재 데이터 읽어오기
  private readData(): Chicken[] {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    const raw = fs.readFileSync(this.filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed.chickens || [];
  }

  // 변경된 내용을 장부(파일)에 저장하기
  private writeData(chickens: Chicken[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify({ chickens }, null, 2), 'utf-8');
  }

  // 전체 치킨집 목록 조회
  findAll(): { chickens: Chicken[] } {
    return { chickens: this.readData() };
  }

  // 상호명으로 특정 치킨집 찾기
  findByName(name: string): Chicken | undefined {
    return this.readData().find((item) => item.name === name);
  }

  // 신규 치킨집 등록
  create(dto: CreateChickenDto): Chicken {
    const chickens = this.readData();
    chickens.push(dto);
    this.writeData(chickens);
    return dto;
  }

  // 치킨집 정보 수정
  update(name: string, dto: UpdateChickenDto): Chicken | null {
    const chickens = this.readData();
    const index = chickens.findIndex((item) => item.name === name);
    if (index === -1) return null;

    chickens[index] = { ...chickens[index], ...dto };
    this.writeData(chickens);
    return chickens[index];
  }

  // 치킨집 정보 삭제
  delete(name: string): Chicken | null {
    const chickens = this.readData();
    const index = chickens.findIndex((item) => item.name === name);
    if (index === -1) return null;

    const [deleted] = chickens.splice(index, 1);
    this.writeData(chickens);
    return deleted;
  }
}
