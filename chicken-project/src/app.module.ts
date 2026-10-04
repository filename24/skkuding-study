import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChickenModule } from './chicken/chicken.module';
import { OrderModule } from './order/order.module';
import { PrismaModule } from './prisma/prisma.module';

/**
 * 매장 본관(AppModule).
 *
 * 치킨집 매장(ChickenModule), 주문 매장(OrderModule), 전역 DB(PrismaModule)를 등록합니다.
 */
@Module({
  imports: [PrismaModule, ChickenModule, OrderModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
