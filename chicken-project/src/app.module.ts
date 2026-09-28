import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChickenModule } from './chicken/chicken.module';

/**
 * 매장 본관(AppModule).
 *
 * 치킨집 매장(ChickenModule)을 본관에 들여오고, 매장 안내 데스크를 등록합니다.
 */
@Module({
  imports: [ChickenModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
