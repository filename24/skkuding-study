import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ChickenService } from './chicken.service';
import { CreateChickenDto, UpdateChickenDto } from './dto/create-chicken.dto';

// @Controller('chicken')은 손님이 http://localhost:3000/chicken 주소로 올 때 이 카운터 직원이 응대하도록 지정합니다.
@Controller('chicken')
export class ChickenController {
  // 생성자(constructor)를 통해 점장님(NestJS)에게 ChickenService 주방장을 배치해달라고 요청합니다. (의존성 주입)
  constructor(private readonly chickenService: ChickenService) {}

  // GET /chicken (전체 목록)
  @Get()
  getAllChickens() {
    return this.chickenService.findAll();
  }

  // GET /chicken/:name (특정 가게 조회)
  @Get(':name')
  getChickenByName(@Param('name') name: string) {
    const chicken = this.chickenService.findByName(name);
    if (!chicken) {
      throw new NotFoundException('해당 치킨집 정보가 존재하지 않습니다.');
    }
    return chicken;
  }

  // POST /chicken (신규 가게 등록)
  @Post()
  createChicken(@Body() createChickenDto: CreateChickenDto) {
    const existing = this.chickenService.findByName(createChickenDto.name);
    if (existing) {
      throw new ConflictException('이미 해당 치킨집 정보가 존재합니다.');
    }
    return this.chickenService.create(createChickenDto);
  }

  // PATCH /chicken/:name (가게 정보 수정)
  @Patch(':name')
  updateChicken(@Param('name') name: string, @Body() updateChickenDto: UpdateChickenDto) {
    const updated = this.chickenService.update(name, updateChickenDto);
    if (!updated) {
      throw new NotFoundException('해당 치킨집 정보가 존재하지 않습니다.');
    }
    return updated;
  }

  // DELETE /chicken/:name (가게 삭제)
  @Delete(':name')
  deleteChicken(@Param('name') name: string) {
    const deleted = this.chickenService.delete(name);
    if (!deleted) {
      throw new NotFoundException('해당 치킨집 정보가 존재하지 않습니다.');
    }
    return deleted;
  }
}
