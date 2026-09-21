import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '치킨집 관리 서버 (NestJS) 입니다! /chicken 으로 접속해보세요.';
  }
}
