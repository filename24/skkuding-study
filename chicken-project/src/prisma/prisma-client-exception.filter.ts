import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

/**
 * Prisma 에러를 NestJS HTTP 응답으로 변환하는 전역 예외 필터.
 *
 * - P2002: Unique 제약조건 위반 -> 409 Conflict
 * - P2025: 레코드를 찾을 수 없음 (findUniqueOrThrow, update/delete 대상 미존재) -> 404 Not Found
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        const target = (exception.meta?.target as string[]) || [];
        const targetField = target.join(', ');
        response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,
          message: targetField
            ? `이미 존재하는 ${targetField} 값입니다.`
            : '이미 해당 치킨집 정보가 존재합니다.',
          error: 'Conflict',
        });
        break;
      }
      case 'P2025': {
        response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: '해당 치킨집 정보가 존재하지 않습니다.',
          error: 'Not Found',
        });
        break;
      }
      default: {
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: exception.message,
          error: 'Internal Server Error',
        });
        break;
      }
    }
  }
}
