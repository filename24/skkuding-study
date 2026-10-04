import 'dotenv/config';
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * 전역 데이터베이스 접근 계층(PrismaService).
 *
 * PrismaClient를 확장하여 NestJS의 라이프사이클에 맞추어
 * 앱 구동 시 DB에 연결($connect)하고, 앱 종료 시 연결을 해제($disconnect)합니다.
 *
 * Prisma 7부터는 PostgreSQL 연결을 위해 드라이버 어댑터(@prisma/adapter-pg)를 전달합니다.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/chicken_db?schema=public';

    const adapter = new PrismaPg({ connectionString });

    super({
      adapter,
      log: ['warn', 'error'],
    });
  }

  /**
   * 모듈 초기화 시 데이터베이스에 연결합니다.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * 애플리케이션 종료 시 DB 커넥션을 안전하게 정리합니다.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
