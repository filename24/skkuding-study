import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../chicken/guards/api-key.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { OrderService } from './order.service';

/**
 * 주문 API 컨트롤러(OrderController).
 */
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * POST /order — 신규 치킨 주문 등록 (트랜잭션)
   */
  @Post()
  @UseGuards(ApiKeyGuard)
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.createOrder(createOrderDto);
  }

  /**
   * GET /order/study/n-plus-one — N+1 쿼리 문제 시뮬레이션
   */
  @Get('study/n-plus-one')
  findNPlusOne(@Query('limit') limit?: number) {
    return this.orderService.findAllNPlusOne(limit ? Number(limit) : 5);
  }

  /**
   * GET /order/study/strategy — relationLoadStrategy ('join' vs 'query') 비교
   */
  @Get('study/strategy')
  findStrategy(
    @Query('strategy') strategy: 'join' | 'query' = 'join',
    @Query('limit') limit?: number,
  ) {
    return this.orderService.findAllEfficient(
      strategy,
      limit ? Number(limit) : 5,
    );
  }

  /**
   * GET /order/v8 — Prisma v8 방식으로 주문 목록 조회 (db.orm.public.Order.offset().limit().all())
   */
  @Get('v8')
  findAllV8(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.orderService.findAllV8(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
    );
  }

  /**
   * GET /order — Prisma v7 방식으로 주문 목록 조회 (Cursor vs Offset 페이지네이션)
   */
  @Get()
  findAll(@Query() query: QueryOrderDto) {
    return this.orderService.findAll(query);
  }

  /**
   * GET /order/:id/v8 — Prisma v8 방식으로 특정 주문 조회 (db.orm.public.Order.where().all().firstOrThrow())
   */
  @Get(':id/v8')
  findOneV8(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findByIdV8(id);
  }

  /**
   * GET /order/:id — Prisma v7 방식으로 특정 주문 상세 조회 (관계 데이터 include)
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findById(id);
  }
}
