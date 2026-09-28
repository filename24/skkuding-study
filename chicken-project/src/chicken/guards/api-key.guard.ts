import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * 실습용 API Key.
 *
 * 실제 서비스에서는 코드에 하드코딩하면 안 되고 환경변수나 시크릿 저장소를 사용합니다.
 * 이 스터디는 Guard의 역할만 이해하기 위한 임시 값입니다.
 */
export const API_KEY = 'chicken-admin-key';

/**
 * 출입 검사 직원(Guard).
 *
 * 카운터에 도착하기 전에 "이 사람이 직원인가?"를 먼저 확인하고,
 * 통과한 요청만 컨트롤러에 전달합니다.
 *
 * `canActivate()`가 `true`를 반환하면 통과하고, `false`를 반환하면
 * NestJS가 요청을 거절합니다(기본적으로 403 Forbidden).
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  /**
   * 요청 헤더의 `x-api-key`를 확인합니다.
   *
   * @param context - 현재 실행 중인 요청의 컨텍스트
   * @returns API Key가 일치하면 `true`, 아니면 `false`
   */
  canActivate(context: ExecutionContext): boolean {
    // 현재 처리 중인 요청(Express의 Request 객체)을 꺼냅니다.
    const request = context.switchToHttp().getRequest();

    return request.headers['x-api-key'] === API_KEY;
  }
}
