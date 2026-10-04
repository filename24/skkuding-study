import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaV8Service } from './prisma-v8.service';

/**
 * 전역 Prisma 모듈.
 *
 * PrismaService(v7)와 PrismaV8Service(v8)를 모두 제공하여
 * 애플리케이션 어디서든 v7과 v8 문법을 병행 사용할 수 있도록 합니다.
 */
@Global()
@Module({
  providers: [PrismaService, PrismaV8Service],
  exports: [PrismaService, PrismaV8Service],
})
export class PrismaModule {}
