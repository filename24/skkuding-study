import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ChickenService } from './chicken.service';
import {
  BatchCreateChickenDto,
  CreateChickenDto,
  OccUpdateChickenDto,
  QueryChickenDto,
  UpdateChickenDto,
  UpdateStockDto,
} from './dto/create-chicken.dto';
import { ApiKeyGuard } from './guards/api-key.guard';

/**
 * 치킨집 API 컨트롤러(ChickenController).
 *
 * 동일한 비즈니스 로직에 대해 Prisma v7 엔드포인트와
 * Prisma v8 전용 엔드포인트(/v8)를 함께 제공하여 문법 및 응답 구조를 비교할 수 있습니다.
 */
@Controller('chicken')
export class ChickenController {
  constructor(private readonly chickenService: ChickenService) {}

  // ==========================================
  // [조회: v7 findMany vs v8 all()]
  // ==========================================

  /**
   * GET /chicken/v8 — Prisma v8 방식으로 전체 목록 조회 (db.orm.public.Chicken.all())
   */
  @Get('v8')
  findAllV8(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.chickenService.findAllV8(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  /**
   * GET /chicken — Prisma v7 방식으로 전체 치킨집 목록 조회
   */
  @Get()
  findAll(@Query() query: QueryChickenDto) {
    return this.chickenService.findAll(query);
  }

  /**
   * GET /chicken/:id/v8 — Prisma v8 방식으로 단건 조회 (.where().all().firstOrThrow())
   */
  @Get(':id/v8')
  findOneV8(@Param('id', ParseIntPipe) id: number) {
    return this.chickenService.findByIdV8(id);
  }

  /**
   * GET /chicken/:id — Prisma v7 방식으로 단건 조회 (findUniqueOrThrow)
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.chickenService.findById(id);
  }

  // ==========================================
  // [등록: v7 create vs v8 create]
  // ==========================================

  /**
   * POST /chicken/v8 — Prisma v8 방식으로 신규 등록 (data 래퍼 없이 직접 전달)
   */
  @Post('v8')
  @UseGuards(ApiKeyGuard)
  createV8(@Body() createChickenDto: CreateChickenDto) {
    return this.chickenService.createV8(createChickenDto);
  }

  /**
   * POST /chicken — Prisma v7 방식으로 신규 등록 (data 래퍼 사용)
   */
  @Post()
  @UseGuards(ApiKeyGuard)
  create(@Body() createChickenDto: CreateChickenDto) {
    return this.chickenService.create(createChickenDto);
  }

  // ==========================================
  // [대량 등록: v7 createMany vs v8 createAll / createAndCount]
  // ==========================================

  /**
   * POST /chicken/batch/v8 — Prisma v8 대량 등록 (createAndCount with onConflict: 'skip')
   */
  @Post('batch/v8')
  @UseGuards(ApiKeyGuard)
  createBatchV8(@Body() batchDto: BatchCreateChickenDto) {
    return this.chickenService.createBatchV8(batchDto);
  }

  /**
   * POST /chicken/batch — Prisma v7 대량 등록 (createMany with skipDuplicates: true)
   */
  @Post('batch')
  @UseGuards(ApiKeyGuard)
  createBatch(@Body() batchDto: BatchCreateChickenDto) {
    return this.chickenService.createBatch(batchDto);
  }

  // ==========================================
  // [수정 및 동시성 제어]
  // ==========================================

  @Patch(':id')
  @UseGuards(ApiKeyGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChickenDto: UpdateChickenDto,
  ) {
    return this.chickenService.update(id, updateChickenDto);
  }

  @Patch(':id/stock')
  @UseGuards(ApiKeyGuard)
  updateStock(
    @Param('id', ParseIntPipe) id: number,
    @Body() stockDto: UpdateStockDto,
  ) {
    return this.chickenService.updateStockAtomic(id, stockDto.quantity);
  }

  @Patch(':id/occ')
  @UseGuards(ApiKeyGuard)
  updateOCC(
    @Param('id', ParseIntPipe) id: number,
    @Body() occDto: OccUpdateChickenDto,
  ) {
    return this.chickenService.updateWithOCC(id, occDto);
  }

  @Delete(':id')
  @UseGuards(ApiKeyGuard)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.chickenService.delete(id);
  }
}
