import { Injectable } from '@nestjs/common';

/**
 * 매장 안내 데스크(AppService).
 */
@Injectable()
export class AppService {
  /**
   * 서버 안내 문구를 만듭니다.
   *
   * @returns 치킨집 관리 서버 안내 문구
   */
  getHello(): string {
    return '치킨집 관리 서버 (NestJS) 입니다! /chicken 으로 접속해보세요.';
  }
}
