import { Module } from '@nestjs/common';
import { ChickenController } from './chicken.controller';
import { ChickenService } from './chicken.service';

@Module({
  controllers: [ChickenController], // 카운터 직원 등록
  providers: [ChickenService], // 주방장 등록
})
export class ChickenModule {}
