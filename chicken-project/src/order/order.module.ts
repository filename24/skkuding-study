import { Module } from '@nestjs/common';
import { ApiKeyGuard } from '../chicken/guards/api-key.guard';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

/**
 * 주문 관리 모듈(OrderModule).
 */
@Module({
  controllers: [OrderController],
  providers: [OrderService, ApiKeyGuard],
  exports: [OrderService],
})
export class OrderModule {}
