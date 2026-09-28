import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

/**
 * 매장 안내 데스크(AppController).
 *
 * 루트 주소(`/`)에 왔을 때 치킨집 서버가 살아 있는지 알려주는 역할을 합니다.
 */
@Controller()
export class AppController {
  /**
   * @param appService - 안내 메시지를 만들어 주는 매장 안내 데스크
   */
  constructor(private readonly appService: AppService) {}

  /**
   * GET / — 서버 안내 문구를 반환합니다.
   *
   * @returns 치킨집 관리 서버 안내 문구
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
