import { Module } from '@nestjs/common';
import { ChickenController } from './chicken.controller';
import { ChickenService } from './chicken.service';
import { ApiKeyGuard } from './guards/api-key.guard';

/**
 * 치킨집 매장 건물(ChickenModule).
 *
 * 카운터 직원(Controller)과 주방장(Service),
 * 그리고 카운터가 사용하는 출입 검사 직원(Guard)을 한 매장에 등록합니다.
 */
@Module({
  controllers: [ChickenController], // 카운터 직원 등록
  providers: [ChickenService, ApiKeyGuard], // 주방장과 출입 검사 직원 등록
})
export class ChickenModule {}
