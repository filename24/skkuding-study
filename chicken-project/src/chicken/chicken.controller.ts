import { Controller, Get, Post, Patch, Delete, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ChickenService } from './chicken.service';
import { CreateChickenDto, UpdateChickenDto } from './dto/create-chicken.dto';
import { ApiKeyGuard } from './guards/api-key.guard';

/**
 * 카운터 직원(ChickenController).
 *
 * 손님(요청)을 받아 검증된 주문서를 주방장(ChickenService)에게 넘기고,
 * 처리 결과를 손님에게 돌려주는 역할만 합니다. 실제 비즈니스 로직은 없습니다.
 */
@Controller('chicken')
export class ChickenController {
  /**
   * 생성자를 통해 점장님(NestJS)에게 ChickenService 주방장을 배치해달라고 요청합니다.
   *
   * @param chickenService - 주문을 실제로 처리할 주방장
   */
  constructor(private readonly chickenService: ChickenService) {}

  /**
   * GET /chicken — 전체 치킨집 목록 조회
   */
  @Get()
  findAll() {
    return this.chickenService.findAll();
  }

  /**
   * GET /chicken/:id — 특정 치킨집 조회
   *
   * `ParseIntPipe`가 URL의 id를 숫자로 바꿔 줍니다. `/chicken/chicken`처럼
   * 숫자로 바꿀 수 없는 값이면 컨트롤러에 도달하기 전에 400으로 거절됩니다.
   *
   * @param id - URL에서 숫자로 변환된 치킨집 번호
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chickenService.findById(id);
  }

  /**
   * POST /chicken — 신규 치킨집 등록
   *
   * `@UseGuards(ApiKeyGuard)`로 출입 검사를 거칩니다. 즉, 직원이 아니면
   * 주문서 내용과 상관없이 403으로 거절됩니다.
   *
   * @param createChickenDto - ValidationPipe 검사를 통과한 등록 주문서
   */
  @Post()
  @UseGuards(ApiKeyGuard)
  create(@Body() createChickenDto: CreateChickenDto) {
    return this.chickenService.create(createChickenDto);
  }

  /**
   * PATCH /chicken/:id — 치킨집 정보 일부 수정
   *
   * @param id - 수정할 치킨집 번호
   * @param updateChickenDto - 바꿀 값만 담은 수정 주문서
   */
  @Patch(':id')
  @UseGuards(ApiKeyGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() updateChickenDto: UpdateChickenDto) {
    return this.chickenService.update(id, updateChickenDto);
  }

  /**
   * DELETE /chicken/:id — 치킨집 삭제
   *
   * @param id - 삭제할 치킨집 번호
   */
  @Delete(':id')
  @UseGuards(ApiKeyGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.chickenService.delete(id);
  }
}
