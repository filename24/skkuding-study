import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * 앱 전역 설정을 적용합니다.
 *
 * `main.ts`와 e2e 테스트가 같은 함수를 사용합니다.
 * 서버가 어떻게 뜨는지(검증 규칙, CORS)를 한 곳에서 관리해야
 * 테스트도 진짜 서버와 완전히 동일한 설정으로 돌 수 있습니다.
 *
 * @param app - 설정할 NestJS 애플리케이션 인스턴스
 */
export function setupApp(app: INestApplication): void {
  // 프론트엔드(브라우저)에서 이 서버의 API를 호출할 수 있도록 CORS 허용
  app.enableCors();

  // 주문서(DTO)에 적힌 검사 규칙을 모든 요청에 적용합니다.
  // - whitelist: DTO에 선언되지 않은 필드는 조용히 잘라냅니다.
  //   (예: 손님이 Body에 id를 끼워 넣어 보내도 서버가 무시합니다)
  // - transform: 요청 값을 DTO에 선언된 타입으로 변환합니다.
  //
  // 참고: forbidNonWhitelisted: true 를 추가하면 잘라내지 않고 400으로 거절합니다.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
}
